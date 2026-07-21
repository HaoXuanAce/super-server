import {
	CallHandler,
	ExecutionContext,
	Injectable,
	NestInterceptor,
} from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import type { Response } from 'express'
import type { Observable } from 'rxjs'
import { map } from 'rxjs/operators'
import { SKIP_RESPONSE_WRAP_KEY } from '../decorators/skip-response-wrap.decorator'
import type { ApiResponse } from '../interface/api-response.interface'
import { ResponseUtil } from '../utils/response.util'

@Injectable()
export class ResponseInterceptor<T>
	implements NestInterceptor<T, ApiResponse<T> | T>
{
	constructor(private readonly reflector: Reflector) {}

	intercept(
		context: ExecutionContext,
		next: CallHandler<T>,
	): Observable<ApiResponse<T> | T> {
		const shouldSkip = this.reflector.getAllAndOverride<boolean>(
			SKIP_RESPONSE_WRAP_KEY,
			[context.getHandler(), context.getClass()],
		)

		if (shouldSkip) {
			return next.handle()
		}

		const response = context.switchToHttp().getResponse<Response>()

		return next.handle().pipe(
			map((data) => {
				if (ResponseUtil.isResponse(data)) {
					return data as ApiResponse<T>
				}

				return {
					code: response.statusCode,
					data: data ?? null,
					message: '请求成功',
				}
			}),
		)
	}
}
