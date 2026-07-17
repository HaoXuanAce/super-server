import {
	Injectable,
	Logger,
	OnModuleDestroy,
	OnModuleInit,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Worker } from 'bullmq'
import type {
	ImageProviderName,
	NormalizedImageRequest,
} from 'src/common/interface/image.interface'
import { TaskService } from 'src/modules/task/task.service'
import { ImageQueueService } from '../image-queue.service'
import { ImageService } from '../image.service'

interface ImageJobData {
	taskId: string
}

@Injectable()
export class ImageGenerationProcessor implements OnModuleInit, OnModuleDestroy {
	private readonly logger = new Logger(ImageGenerationProcessor.name)
	private readonly worker: Worker<ImageJobData>

	constructor(
		private readonly configService: ConfigService,
		private readonly imageService: ImageService,
		private readonly imageQueueService: ImageQueueService,
		private readonly taskService: TaskService,
	) {
		this.worker = new Worker(
			'image-generation',
			async (job) => {
				if (job.name === 'poll') {
					this.logger.log(`图片任务轮询: ${job.data.taskId}`)
				} else {
					this.logger.log(`图片任务开始: ${job.data.taskId}`)
				}
				return this.process(job.name, job.data.taskId)
			},
			{
				connection: {
					host: this.configService.getOrThrow<string>('REDIS_HOST'),
					port: Number(
						this.configService.getOrThrow<string>('REDIS_PORT'),
					),
					password: this.configService.get<string>('REDIS_PASSWORD'),
					db: Number(
						this.configService.getOrThrow<string>('REDIS_DB'),
					),
					maxRetriesPerRequest: null,
				},
				concurrency: 1,
			},
		)

		this.worker.on('failed', (job, error) => {
			this.logger.error(`图片任务失败: ${job?.data.taskId}`, error.stack)
		})
	}

	onModuleInit() {
		this.logger.log('图片队列 worker 已启动')
	}

	onModuleDestroy() {
		return this.worker.close()
	}

	private async process(jobName: string, taskId: string) {
		try {
			if (jobName === 'poll') {
				return await this.poll(taskId)
			}

			return await this.generate(taskId)
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : '图片任务执行失败'
			await this.imageService.failTaskAndRefund(taskId, errorMessage)
			throw error
		}
	}

	private async generate(taskId: string) {
		const task = await this.taskService.find(taskId)
		await this.taskService.update(taskId, { status: 'processing' })

		const result = await this.imageService.create(
			task.input as NormalizedImageRequest,
		)
		if (result.status === 'processing' && result.providerTaskId) {
			await this.taskService.update(taskId, {
				providerTaskId: result.providerTaskId,
			})
			await this.imageQueueService.addPollTask(taskId)
			return result
		}

		await this.taskService.update(taskId, {
			status: 'completed',
			result: result.result ?? result,
		})
		return result
	}

	private async poll(taskId: string) {
		const task = await this.taskService.find(taskId)
		if (!task.provider || !task.providerTaskId) {
			throw new Error('图片任务缺少 provider 或 providerTaskId')
		}

		const result = await this.imageService.pollTask(
			task.provider as ImageProviderName,
			task.providerTaskId,
		)

		if (result.status === 'failed') {
			await this.imageService.failTaskAndRefund(
				taskId,
				'图片供应商返回生成失败',
				result,
			)
			this.logger.error(`图片任务失败: ${taskId}`)
			return result
		}

		if (result.url) {
			await this.taskService.update(taskId, {
				status: 'completed',
				result,
			})
			this.logger.log(`图片任务完成: ${taskId}`)
			return result
		}

		await this.imageQueueService.addPollTask(taskId)
		return result
	}
}
