import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { Queue } from 'bullmq'

@Injectable()
export class ImageQueueService implements OnModuleDestroy {
	private readonly logger = new Logger(ImageQueueService.name)
	private readonly queue: Queue

	constructor(private readonly configService: ConfigService) {
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

	async enqueue(taskId: string) {
		// TODO: 生产环境改为 transactional outbox，避免数据库成功但 Redis 投递失败。
		await this.queue.add('generate', { taskId }, { jobId: taskId })
		this.logger.log(`图片任务已入队: ${taskId}`)
	}

	addPollTask(taskId: string) {
		return this.queue.add('poll', { taskId }, { delay: 5000 })
	}

	onModuleDestroy() {
		return this.queue.close()
	}
}
