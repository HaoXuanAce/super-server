import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'

@Injectable()
export class AiService {
	private readonly client: OpenAI

	constructor(private readonly configService: ConfigService) {
		const apiKey = this.configService.get<string>('apikey')
		const baseURL = this.configService.get<string>('baseurl')

		this.client = new OpenAI({
			apiKey,
			baseURL,
		})
	}

	getClient(): OpenAI {
		return this.client
	}
}
