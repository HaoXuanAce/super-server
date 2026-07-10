import {
	ArgumentsHost,
	Catch,
	HttpException,
	HttpStatus,
	Logger,
} from '@nestjs/common'
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core'
import type { ApiResponse } from '../interface/api-response.interface'

@Catch()
export class AllExceptionsFilter extends BaseExceptionFilter {
	private readonly logger = new Logger(AllExceptionsFilter.name)

	constructor(private readonly adapterHost: HttpAdapterHost) {
		super(adapterHost.httpAdapter)
	}

	catch(exception: unknown, host: ArgumentsHost): void {
		const { httpAdapter } = this.adapterHost
		const context = host.switchToHttp()
		const status =
			exception instanceof HttpException
				? exception.getStatus()
				: HttpStatus.INTERNAL_SERVER_ERROR

		if (!(exception instanceof HttpException)) {
			const stack =
				exception instanceof Error ? exception.stack : undefined
			this.logger.error('未处理的服务器异常', stack)
		}

		const body: ApiResponse<null> = {
			code: status,
			data: null,
			message: this.getMessage(exception),
		}

		httpAdapter.reply(context.getResponse(), body, status)
	}

	private getMessage(exception: unknown): string {
		if (!(exception instanceof HttpException)) {
			return '服务器内部错误'
		}

		const response = exception.getResponse()
		if (typeof response === 'string') {
			return response
		}

		const message = (response as { message?: unknown }).message
		if (message === undefined) {
			return exception.message
		}

		return this.formatMessage(message, exception.message)
	}

	private formatMessage(message: unknown, fallback: string): string {
		if (typeof message === 'string') {
			return message
		}

		if (Array.isArray(message)) {
			return message
				.map((item) => this.formatMessage(item, fallback))
				.join('; ')
		}

		if (
			typeof message === 'number' ||
			typeof message === 'boolean' ||
			typeof message === 'bigint'
		) {
			return message.toString()
		}

		return fallback
	}
}
