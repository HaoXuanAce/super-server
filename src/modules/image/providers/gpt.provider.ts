import { BadRequestException, Injectable } from '@nestjs/common'
import type { CreateImageDto } from '../dto/create-image.dto'
import axios from 'axios'
import { ConfigService } from '@nestjs/config'
import { ResponseUtil } from 'src/common/utils/response.util'

@Injectable()
export class GptImageProvider {
	private readonly baseUrl: string
	private readonly apiKey: string
	private readonly imageUrl: string
	private readonly imagePoll: string

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
		console.log('🔥 [gpt.provider.ts] response:', response)

		// eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
		const taskId = response.data[0]?.task_id as string | undefined
		if (!taskId) {
			throw new BadRequestException('图片生成任务创建失败')
		}

		return ResponseUtil.success({ taskId })
	}

	async pollTask(taskId: string) {
		const url = this.baseUrl + this.imagePoll

		const response = await axios.post<Record<string, unknown>>(
			url,
			{ task_id: taskId },
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization: this.authHeader,
				},
			},
		)
		const result = {
			status: response.data.status,
			taskId: response.data.task_id,
			url: response.data.id,
		}

		return ResponseUtil.success({ result })
	}
}
