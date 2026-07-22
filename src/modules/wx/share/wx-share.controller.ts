import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
	ParseIntPipe,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common'
import type { WxAuthenticatedRequest } from '../auth/wx-auth.types'
import { WxJwtAuthGuard } from '../auth/wx-jwt-auth.guard'
import { SubmitWxAnswerDto } from './dto/submit-wx-answer.dto'
import { WxShareService } from './wx-share.service'

@Controller()
@UseGuards(WxJwtAuthGuard)
export class WxShareController {
	constructor(private readonly shareService: WxShareService) {}

	@Get(':token')
	findByToken(
		@Param('token') token: string,
	) {
		return this.shareService.findByToken(token)
	}

	@Post(':token/answers')
	submitAnswer(
		@Req() request: WxAuthenticatedRequest,
		@Param('token') token: string,
		@Body() dto: SubmitWxAnswerDto,
	) {
		return this.shareService.submitAnswer(request.user.id, token, dto)
	}

	@Delete(':id')
	revoke(
		@Req() request: WxAuthenticatedRequest,
		@Param('id', ParseIntPipe) id: number,
	) {
		return this.shareService.revoke(request.user.id, id)
	}
}
