import { BadRequestException, Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { defer, filter, from, map, Observable, switchMap } from 'rxjs'
import { AiService } from '../ai/ai.service'
import type { StreamChatDto } from './dto/stream-chat.dto'

@Injectable()
export class ChatService {
	private readonly maxContextLength = 30000

	constructor(
		private readonly aiService: AiService,
		private readonly configService: ConfigService,
	) {}

	validateRequest(dto: StreamChatDto): void {
		if (dto.messages.at(-1)?.role !== 'user') {
			throw new BadRequestException('最后一条消息必须来自用户')
		}

		const totalLength = dto.messages.reduce(
			(total, message) => total + message.content.length,
			0,
		)

		if (totalLength > this.maxContextLength) {
			throw new BadRequestException('对话上下文过长')
		}
	}

	streamChat(dto: StreamChatDto, signal: AbortSignal): Observable<string> {
		return defer(() => this.createModelStream(dto, signal)).pipe(
			switchMap((stream) => from(stream)),
			map((chunk) => chunk.choices[0]?.delta?.content ?? ''),
			filter((delta): delta is string => delta.length > 0),
		)
	}

	private createModelStream(dto: StreamChatDto, signal: AbortSignal) {
		const model = this.configService.get<string>(
			'DEEPSEEK_MODEL',
			'deepseek-v4-flash',
		)
		const systemPrompt = this.configService.get<string>(
			'DEEPSEEK_SYSTEM_PROMPT',
			'你是一个专业、友好的 AI 助手，请使用中文回答。',
		)

		return this.aiService.getTextClient().chat.completions.create(
			{
				model,
				stream: true,
				messages: [
					{ role: 'system', content: systemPrompt },
					...dto.messages,
				],
			},
			{
				signal,
				timeout: 2 * 60 * 1000,
				maxRetries: 0,
			},
		)
	}
}
