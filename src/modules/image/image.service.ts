import { BadRequestException, Injectable } from '@nestjs/common'
import type { CreateImageDto } from './dto/create-image.dto'
import { DoubaoImageProvider } from './providers/doubao.provider'
import { GptImageProvider } from './providers/gpt.provider'

@Injectable()
export class ImageService {
	constructor(
		private readonly gptImageProvider: GptImageProvider,
		private readonly doubaoImageProvider: DoubaoImageProvider,
	) {}

	async create(dto: CreateImageDto) {
		const { model } = dto
		if (model.startsWith('chatGTPImage2')) {
			return this.gptImageProvider.generate(dto)
		} else if (model.startsWith('doubao')) {
			return this.doubaoImageProvider.generate(dto)
		}

		throw new BadRequestException('不支持的图片模型')
	}

	pollTask(taskId: string) {
		return this.gptImageProvider.pollTask(taskId)
	}
}
