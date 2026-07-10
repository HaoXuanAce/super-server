import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'

@Injectable()
export class AiService {
	private readonly client: OpenAI

	constructor(private readonly configService: ConfigService) {
		const apiKey = this.configService.get<string>('JDTS-apiKey')
		const baseURL = this.configService.get<string>('JDTS-baseUrl')

		this.client = new OpenAI({
			apiKey,
			baseURL,
		})
	}

	getClient(): OpenAI {
		return this.client
	}
}
