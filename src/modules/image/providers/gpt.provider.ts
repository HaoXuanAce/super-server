import { Injectable } from '@nestjs/common'
import type { CreateImageDto } from '../dto/create-image.dto'
import axios from 'axios'
import { ConfigService } from '@nestjs/config'
@Injectable()
export class GptImageProvider {
	constructor(private readonly configService: ConfigService) {}

	async generate(query: CreateImageDto) {
		const params = {
			model: query.model,
			prompt: query.prompt,
			images: query.images,
			metadata: {
				aspect_ratio: query.ratio,
				enhance_prompt: 'Enabled',
				output_image_count: '1',
			},
		}

		const baseUrl = this.configService.get<string>('baseurl')
		const apikey = this.configService.get<string>('apikey')
		const url = baseUrl + '/v1/images/generations/'
		const token = `Bearer ${apikey}`

		const data = await axios.post(url, params, {
			headers: {
				'Content-Type': 'application/json',
				'X-DashScope-Async': 'enable',
				Authorization: token,
			},
		})

		console.log(data)
	}
}
