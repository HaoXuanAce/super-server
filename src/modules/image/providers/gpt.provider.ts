import { BadRequestException, Injectable, Logger } from '@nestjs/common'
import type { CreateImageDto } from '../dto/create-image.dto'
import axios from 'axios'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class GptImageProvider {
	private readonly baseUrl: string
	private readonly apiKey: string
	private readonly imageUrl: string
	private readonly imagePoll: string
	private readonly logger = new Logger()

	constructor(private readonly configService: ConfigService) {
		this.baseUrl = this.configService.get<string>('JDTS-baseUrl')!
		this.apiKey = this.configService.get<string>('JDTS-apiKey')!
		this.imageUrl = this.configService.get<string>('JDTS-imageUrl')!
		this.imagePoll = this.configService.get<string>('JDTS-imagePoll')!
	}

	private get authHeader() {
		return `Bearer ${this.apiKey}`
	}

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

		const url = this.baseUrl + this.imageUrl
		const response = await axios.post(url, params, {
			headers: {
				'Content-Type': 'application/json',
				Authorization: this.authHeader,
			},
		})
		console.log('🔥 [gpt.provider.ts] response:', response.data)

		const taskId = response.data.data?.[0]?.task_id as string | undefined
		if (!taskId) {
			throw new BadRequestException('图片生成任务创建失败')
		}

		return { taskId }
	}

	async pollTask(taskId: string) {
		const url = this.baseUrl + this.imagePoll

		const response = await axios.post<any>(
			url,
			{ task_id: taskId },
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization: this.authHeader,
				},
			},
		)

		this.logger.warn(response.data, '轮询的任务结果')
		const result = response.data.data
		return {
			status: result.status,
			taskId: result.task_id,
			url: result.url,
		}
	}
}
