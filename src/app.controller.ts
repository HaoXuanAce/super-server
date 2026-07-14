import { Controller, Get } from '@nestjs/common'
import {
	ApiOkResponse,
	ApiOperation,
	ApiProperty,
	ApiTags,
} from '@nestjs/swagger'
import { AppService } from './app.service'

class HelloResponseDto {
	@ApiProperty({
		example: 'Hello World!',
		description: '服务返回的问候语',
	})
	message!: string
}

class ApiExampleResponseDto {
	@ApiProperty({
		example: 'images',
		description: '模块名称',
	})
	module!: string

	@ApiProperty({
		example: 'GET',
		description: 'HTTP 请求方法',
	})
	method!: string

	@ApiProperty({
		example: '/api/images',
		description: '接口路径',
	})
	path!: string

	@ApiProperty({
		example: '图片列表接口示例',
		description: '接口说明',
	})
	description!: string
}

@ApiTags('app')
@Controller()
export class AppController {
	constructor(private readonly appService: AppService) {}

	@Get()
	@ApiOperation({ summary: '获取服务问候语' })
	@ApiOkResponse({ type: HelloResponseDto })
	getHello(): HelloResponseDto {
		return this.appService.getHello()
	}

	@Get('examples')
	@ApiOperation({ summary: '获取 Swagger 文档示例接口列表' })
	@ApiOkResponse({ type: [ApiExampleResponseDto] })
	getExamples(): ApiExampleResponseDto[] {
		return this.appService.getExamples()
	}
}
