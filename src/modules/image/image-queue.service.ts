import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Queue } from 'bullmq'
import { TaskService } from 'src/modules/task/task.service'
import type { CreateImageDto } from './dto/create-image.dto'

@Injectable()
export class ImageQueueService implements OnModuleDestroy {
	private readonly logger = new Logger(ImageQueueService.name)
	private readonly queue: Queue

	constructor(
		private readonly configService: ConfigService,
		private readonly taskService: TaskService,
	) {
		this.queue = new Queue('image-generation', {
			connection: {
				host: this.configService.getOrThrow<string>('REDIS_HOST'),
				port: Number(
					this.configService.getOrThrow<string>('REDIS_PORT'),
				),
				password: this.configService.get<string>('REDIS_PASSWORD'),
				db: Number(this.configService.getOrThrow<string>('REDIS_DB')),
			},
			defaultJobOptions: {
				attempts: 1,
				removeOnComplete: { age: 60 * 60 * 24 },
				removeOnFail: { age: 60 * 60 * 24 * 7 },
			},
		})
	}

	async add(dto: CreateImageDto) {
		const task = await this.taskService.create('image', dto)
		await this.queue.add('generate', {
			taskId: task.id,
		})
		this.logger.log(`图片任务已入队: ${task.id}`)

		return {
			taskId: task.id,
			status: task.status,
		}
	}

	addPollTask(taskId: string) {
		return this.queue.add('poll', { taskId }, { delay: 5000 })
	}

	onModuleDestroy() {
		return this.queue.close()
	}
}
