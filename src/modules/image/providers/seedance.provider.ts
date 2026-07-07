import { Injectable } from '@nestjs/common'
import { AiService } from '../../ai/ai.service'
import { ImageModel } from '../enums/image-model.enum'
import { ImageProvider } from '../interfaces/image-provider.interface'
import { SeedanceImageDto } from '../dto/seedance-image.dto'
import { ImageResult } from '../interface/image-result.interface'

@Injectable()
export class SeedanceImageProvider implements ImageProvider<SeedanceImageDto> {
	readonly model = ImageModel.SEEDANCE

	constructor(private readonly ai: AiService) {}

	async generate(params: SeedanceImageDto): Promise<ImageResult> {
		// Seedance 使用 chat completion 做图片生成
		// 具体 API 参数按实际厂商文档调整
		console.log(
			'[seedance] generate',
			params.prompt,
			params.duration,
			params.aspectRatio,
		)

		return {
			id: '',
			prompt: params.prompt,
			url: 'https://placeholder.example/seedance-output.png',
			createdAt: new Date(),
		}
	}
}
