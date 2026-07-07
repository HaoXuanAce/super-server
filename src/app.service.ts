import { Injectable } from '@nestjs/common'

export interface HelloResponse {
	message: string
}

export interface ApiExampleResponse {
	module: string
	method: string
	path: string
	description: string
}

@Injectable()
export class AppService {
	getHello(): HelloResponse {
		return {
			message: 'Hello World!',
		}
	}

	getExamples(): ApiExampleResponse[] {
		return [
			{
				module: 'app',
				method: 'GET',
				path: '/',
				description: '获取服务问候语',
			},
			{
				module: 'image',
				method: 'POST',
				path: '/images',
				description: '图片生成接口示例，后续可以接入 ImageModule',
			},
		]
	}
}
