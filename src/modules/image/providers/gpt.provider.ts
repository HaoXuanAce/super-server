import { Injectable } from '@nestjs/common'
import { AiService } from '../../ai/ai.service'
import { ImageModel } from '../enums/image-model.enum'
import { ImageProvider } from '../interfaces/image-provider.interface'
import { GptImageDto } from '../dto/gpt-image.dto'
import { ImageResult } from '../interface/image-result.interface'

@Injectable()
export class GptImageProvider implements ImageProvider<GptImageDto> {
	readonly model = ImageModel.GPT

	constructor(private readonly ai: AiService) {}

	async generate(params: GptImageDto): Promise<ImageResult> {
		const res = await this.ai.getClient().images.generate({
			model: 'gpt-image-1',
			prompt: params.prompt,
			size: params.size,
			quality: params.quality,
		})

		return {
			id: '',
			prompt: params.prompt,
			url: res.data?.[0]?.url ?? '',
			createdAt: new Date(),
		}
	}
}
