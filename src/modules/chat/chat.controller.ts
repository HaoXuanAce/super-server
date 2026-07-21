import {
	Body,
	Controller,
	Logger,
	Post,
	Req,
	Res,
	UseGuards,
} from '@nestjs/common'
import { randomUUID } from 'node:crypto'
import type { Response } from 'express'
import type { Subscription } from 'rxjs'
import { SkipResponseWrap } from '../../common/decorators/skip-response-wrap.decorator'
import type { AuthenticatedRequest } from '../auth/auth.types'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import type { ChatStreamEventPayload, ChatStreamEventType } from './chat.types'
import { ChatService } from './chat.service'
import { StreamChatDto } from './dto/stream-chat.dto'

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
	private readonly logger = new Logger(ChatController.name)
	private readonly heartbeatIntervalMs = 15000

	constructor(private readonly chatService: ChatService) {}

	@Post('stream')
	@SkipResponseWrap()
	stream(
		@Body() dto: StreamChatDto,
		@Req() request: AuthenticatedRequest,
		@Res() response: Response,
	): Promise<void> {
		// 在发送 SSE 响应头前完成校验，失败时仍由全局异常过滤器返回 JSON。
		this.chatService.validateRequest(dto)
		this.logger.log('🚀收到前端请求,请求内容:', dto)
		console.log(dto)

		const turnId = randomUUID()
		const abortController = new AbortController()
		let sequence = 0
		let settled = false
		let subscription: Subscription | undefined

		response.status(200)
		response.setHeader('Content-Type', 'text/event-stream; charset=utf-8')
		response.setHeader('Cache-Control', 'no-cache, no-transform')
		response.setHeader('Connection', 'keep-alive')
		response.setHeader('X-Accel-Buffering', 'no')

		return new Promise<void>((resolve) => {
			const writeEvent = (
				eventType: ChatStreamEventType,
				data: Record<string, unknown>,
			): void => {
				if (response.destroyed || response.writableEnded) return

				sequence += 1
				const payload: ChatStreamEventPayload = {
					turnId,
					seq: sequence,
					...data,
				}

				response.write(`id: ${sequence}\n`)
				response.write(`event: ${eventType}\n`)
				response.write(`data: ${JSON.stringify(payload)}\n\n`)
			}

			const finish = (endResponse: boolean): void => {
				if (settled) return

				settled = true
				clearInterval(heartbeat)
				response.off('close', handleClose)

				if (
					endResponse &&
					!response.destroyed &&
					!response.writableEnded
				) {
					response.end()
				}

				resolve()
			}

			const handleClose = (): void => {
				if (settled) return

				abortController.abort()
				subscription?.unsubscribe()
				finish(false)
			}

			const heartbeat = setInterval(() => {
				if (!response.destroyed && !response.writableEnded) {
					response.write(': ping\n\n')
				}
			}, this.heartbeatIntervalMs)

			response.on('close', handleClose)
			response.flushHeaders()
			writeEvent('start', {
				status: 'streaming',
			})

			subscription = this.chatService
				.streamChat(dto, abortController.signal)
				.subscribe({
					next: (delta) => {
						writeEvent('message.delta', { delta })
					},
					error: (error: unknown) => {
						if (
							abortController.signal.aborted ||
							response.destroyed
						) {
							finish(false)
							return
						}

						this.logger.error(
							`AI 流式对话失败: ${turnId}, userId: ${request.user.id}`,
							error instanceof Error
								? error.stack
								: String(error),
						)
						writeEvent('error', {
							status: 'failed',
							code: 'MODEL_STREAM_FAILED',
							message: 'AI 回复生成失败，请稍后重试',
						})
						finish(true)
					},
					complete: () => {
						writeEvent('done', {
							status: 'completed',
						})
						finish(true)
					},
				})
		})
	}
}
