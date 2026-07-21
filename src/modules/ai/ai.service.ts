import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OpenAI from 'openai'

@Injectable()
export class AiService {
	private readonly imageClient: OpenAI
	private readonly textClient: OpenAI

	constructor(private readonly configService: ConfigService) {
		const apiKey = this.configService.get<string>('JDTS-apiKey')
		const baseURL = this.configService.get<string>('JDTS-baseUrl')
		const deepSeekApiKey =
			this.configService.getOrThrow<string>('DEEPSEEK_APIKey')
		const deepSeekBaseURL =
			this.configService.getOrThrow<string>('DEEPSEEK_BASEURL')

		this.imageClient = new OpenAI({
			apiKey,
			baseURL,
		})
		this.textClient = new OpenAI({
			apiKey: deepSeekApiKey,
			baseURL: deepSeekBaseURL,
		})
	}

	getImageClient(): OpenAI {
		return this.imageClient
	}

	getTextClient(): OpenAI {
		return this.textClient
	}
}
