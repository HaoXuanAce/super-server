import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { randomUUID } from 'node:crypto'
import type { CreateTaskInput } from 'src/common/interface/task.interface'
import { Repository } from 'typeorm'
import { TaskEntity } from './entities/task.entity'

@Injectable()
export class TaskService {
	constructor(
		@InjectRepository(TaskEntity)
		private readonly taskRepository: Repository<TaskEntity>,
	) {}

	create(input: CreateTaskInput) {
		return this.taskRepository.save({
			id: input.id || randomUUID(),
			type: input.type,
			status: 'pending',
			userId: input.userId,
			provider: input.provider,
			model: input.model,
			input: input.input,
			chargeAmount: input.chargeAmount,
			billingStatus: 'pending',
			pricingSnapshot: input.pricingSnapshot,
			clientRequestId: input.clientRequestId ?? null,
			providerTaskId: null,
			result: null,
			errorMessage: null,
			refundedAt: null,
		})
	}

	async find(taskId: string) {
		const task = await this.taskRepository.findOneBy({ id: taskId })
		if (!task) {
			throw new NotFoundException('任务不存在')
		}

		return task
	}

	findByClientRequestId(userId: string, clientRequestId: string) {
		return this.taskRepository.findOneBy({ userId, clientRequestId })
	}

	async update(taskId: string, values: Partial<TaskEntity>) {
		await this.taskRepository.update(taskId, values)
		return this.find(taskId)
	}
}
