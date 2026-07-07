import { Injectable } from '@nestjs/common'
import { CreateImageDto } from './dto/create-image.dto'
import { ImageResult } from './interface/image-result.interface'
import { ImageProviderRegistry } from './providers/image-provider.registry'

@Injectable()
export class ImageService {
	constructor(private readonly registry: ImageProviderRegistry) {}

	async create(dto: CreateImageDto): Promise<ImageResult> {
		const provider = this.registry.resolve(dto.model)
		const taskId = await this.deduct(dto)
		await this.recordTask(taskId, dto)

		try {
			const result = await provider.generate(dto)
			await this.finalize(taskId, result)
			return result
		} catch (e) {
			await this.markFailed(taskId, e)
			throw e
		}
	}

	private async deduct(dto: CreateImageDto): Promise<string> {
		const taskId = `task_${Date.now()}`
		console.log(`[deduct] model=${dto.model} taskId=${taskId}`)
		return taskId
	}

	private async recordTask(
		taskId: string,
		dto: CreateImageDto,
	): Promise<void> {
		console.log(`[task] create taskId=${taskId} prompt=${dto.prompt}`)
	}

	private async finalize(taskId: string, result: ImageResult): Promise<void> {
		console.log(`[task] done taskId=${taskId} url=${result.url}`)
	}

	private async markFailed(taskId: string, e: unknown): Promise<void> {
		console.log(
			`[task] failed taskId=${taskId} error=${(e as Error)?.message ?? e}`,
		)
	}
}
