import {
	Body,
	Controller,
	Get,
	Param,
	Post,
	Query,
	Req,
	UseGuards,
} from '@nestjs/common'
import type { WxAuthenticatedRequest } from '../auth/wx-auth.types'
import { WxJwtAuthGuard } from '../auth/wx-jwt-auth.guard'
import { CreateWxShareDto } from '../share/dto/create-wx-share.dto'
import { QueryWxAnswersDto } from './dto/query-wx-answers.dto'
import { WxAnswerService } from './wx-answer.service'

@Controller()
@UseGuards(WxJwtAuthGuard)
export class WxAnswerController {
	constructor(private readonly answerService: WxAnswerService) {}

	@Get()
	findMine(
		@Req() request: WxAuthenticatedRequest,
		@Query() query: QueryWxAnswersDto,
	) {
		return this.answerService.findMine(request.user.id, query)
	}

	@Get(':id')
	findOne(
		@Req() request: WxAuthenticatedRequest,
		@Param('id') id: string,
	) {
		return this.answerService.findOne(request.user.id, id)
	}

	@Post(':id/shares')
	createShare(
		@Req() request: WxAuthenticatedRequest,
		@Param('id') id: string,
		@Body() dto: CreateWxShareDto,
	) {
		return this.answerService.createShare(request.user.id, id, dto)
	}
}
