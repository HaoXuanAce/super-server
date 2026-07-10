import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { randomUUID } from 'node:crypto'
import { Repository } from 'typeorm'
import { TaskEntity } from './entities/task.entity'

@Injectable()
export class TaskService {
	constructor(
		@InjectRepository(TaskEntity)
		private readonly taskRepository: Repository<TaskEntity>,
	) {}

	create(type: string, input: object) {
		return this.taskRepository.save({
			id: randomUUID(),
			type,
			status: 'pending',
			input,
			providerTaskId: null,
			result: null,
			errorMessage: null,
		})
	}

	async find(taskId: string) {
		const task = await this.taskRepository.findOneBy({ id: taskId })
		if (!task) {
			throw new NotFoundException('任务不存在')
		}

		return task
	}

	async update(taskId: string, values: Partial<TaskEntity>) {
		await this.taskRepository.update(taskId, values)
		return this.find(taskId)
	}
}
