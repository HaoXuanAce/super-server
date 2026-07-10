import {
	Injectable,
	Logger,
	OnModuleDestroy,
	OnModuleInit,
} from '@nestjs/common'
import { Worker } from 'bullmq'
import { QueueConnectionService } from 'src/core/queue/queue-connection.service'
import { QueueName } from 'src/core/queue/queue-name'
import { TaskService } from 'src/modules/task/task.service'
import type { CreateImageDto } from '../dto/create-image.dto'
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
		private readonly queueConnection: QueueConnectionService,
		private readonly imageService: ImageService,
		private readonly imageQueueService: ImageQueueService,
		private readonly taskService: TaskService,
	) {
		this.worker = new Worker(
			QueueName.IMAGE_GENERATION,
			async (job) => {
				if (job.name === 'poll') {
					this.logger.log(`图片任务轮询: ${job.data.taskId}`)
				} else {
					this.logger.log(`图片任务开始: ${job.data.taskId}`)
				}
				return this.process(job.name, job.data.taskId)
			},
			{
				connection: this.queueConnection.createWorkerConnection(),
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
			await this.taskService.update(taskId, {
				status: 'failed',
				errorMessage:
					error instanceof Error ? error.message : '图片任务执行失败',
			})
			throw error
		}
	}

	private async generate(taskId: string) {
		const task = await this.taskService.find(taskId)
		await this.taskService.update(taskId, { status: 'processing' })

		const result = await this.imageService.create(
			task.input as CreateImageDto,
		)
		if ('taskId' in result) {
			await this.taskService.update(taskId, {
				providerTaskId: result.taskId,
			})
			await this.imageQueueService.addPollTask(taskId)
			return result
		}

		await this.taskService.update(taskId, {
			status: 'completed',
			result,
		})
		return result
	}

	private async poll(taskId: string) {
		const task = await this.taskService.find(taskId)
		const result = await this.imageService.pollTask(task.providerTaskId!)

		if (result.status === 'failed') {
			await this.taskService.update(taskId, {
				status: 'failed',
				errorMessage: '图片生成失败',
				result,
			})
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
