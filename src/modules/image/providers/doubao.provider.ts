import { Injectable, Logger } from '@nestjs/common'
import type { CreateImageDto } from '../dto/create-image.dto'

@Injectable()
export class DoubaoImageProvider {
	readonly model = 'doubao'
	private readonly logger = new Logger(DoubaoImageProvider.name)

	generate(params: CreateImageDto) {
		this.logger.log(
			{
				prompt: params.prompt,
				resolution: params.resolution,
				ratio: params.ratio,
			},
			'豆包图片生成请求',
		)

		return {
			id: `doubao_${Date.now()}`,
			prompt: params.prompt,
			url: 'https://placeholder.example/doubao-output.png',
			createdAt: new Date(),
		}
	}
}
