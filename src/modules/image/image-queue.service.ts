import { Injectable, Logger } from '@nestjs/common'
import { QueueName } from 'src/core/queue/queue-name'
import { QueueService } from 'src/core/queue/queue.service'
import { TaskService } from 'src/modules/task/task.service'
import type { CreateImageDto } from './dto/create-image.dto'

@Injectable()
export class ImageQueueService {
	private readonly logger = new Logger(ImageQueueService.name)

	constructor(
		private readonly queueService: QueueService,
		private readonly taskService: TaskService,
	) {}

	async add(dto: CreateImageDto) {
		const task = await this.taskService.create('image', dto)
		await this.queueService.add(QueueName.IMAGE_GENERATION, 'generate', {
			taskId: task.id,
		})
		this.logger.log(`图片任务已入队: ${task.id}`)

		return {
			taskId: task.id,
			status: task.status,
		}
	}

	addPollTask(taskId: string) {
		return this.queueService.add(
			QueueName.IMAGE_GENERATION,
			'poll',
			{ taskId },
			5000,
		)
	}
}
