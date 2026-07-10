import { Injectable } from '@nestjs/common'
import type { CreateImageDto } from '../dto/create-image.dto'

@Injectable()
export class DoubaoImageProvider {
	readonly model = 'doubao'

	generate(params: CreateImageDto) {
		console.log(
			'[doubao] generate',
			params.prompt,
			params.resolution,
			params.ratio,
		)

		return {
			id: `doubao_${Date.now()}`,
			prompt: params.prompt,
			url: 'https://placeholder.example/doubao-output.png',
			createdAt: new Date(),
		}
	}
}
