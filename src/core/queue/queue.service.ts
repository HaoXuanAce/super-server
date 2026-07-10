import { Injectable, OnModuleDestroy } from '@nestjs/common'
import { Queue } from 'bullmq'
import { QueueConnectionService } from './queue-connection.service'
import type { QueueName } from './queue-name'

@Injectable()
export class QueueService implements OnModuleDestroy {
	private readonly queues = new Map<QueueName, Queue>()

	constructor(private readonly queueConnection: QueueConnectionService) {}

	add(queueName: QueueName, jobName: string, data: unknown, delay = 0) {
		return this.getQueue(queueName).add(jobName, data, { delay })
	}

	async onModuleDestroy() {
		await Promise.all(
			[...this.queues.values()].map((queue) => queue.close()),
		)
	}

	private getQueue(queueName: QueueName) {
		const queue = this.queues.get(queueName)
		if (queue) {
			return queue
		}

		const newQueue = new Queue(queueName, {
			connection: this.queueConnection.createQueueConnection(),
			defaultJobOptions: {
				attempts: 1,
				removeOnComplete: { age: 60 * 60 * 24 },
				removeOnFail: { age: 60 * 60 * 24 * 7 },
			},
		})
		this.queues.set(queueName, newQueue)
		return newQueue
	}
}
