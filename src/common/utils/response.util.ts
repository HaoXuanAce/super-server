import { HttpStatus } from '@nestjs/common'
import type { ApiResponse } from '../interface/api-response.interface'

export class ResponseUtil {
	static success<T>(
		data: T,
		message = '请求成功',
		code = HttpStatus.OK,
	): ApiResponse<T> {
		return {
			code,
			data,
			message,
		}
	}

	static isResponse(value: unknown): value is ApiResponse {
		if (typeof value !== 'object' || value === null) {
			return false
		}

		const response = value as Record<string, unknown>
		return (
			typeof response.code === 'number' &&
			'data' in response &&
			typeof response.message === 'string'
		)
	}
}
