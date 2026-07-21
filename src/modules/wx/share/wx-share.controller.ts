import {
	Body,
	Controller,
	Delete,
	Get,
	Param,
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
		@Req() request: WxAuthenticatedRequest,
		@Param('token') token: string,
	) {
		return this.shareService.findByToken(request.user.id, token)
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
	revoke(@Req() request: WxAuthenticatedRequest, @Param('id') id: string) {
		return this.shareService.revoke(request.user.id, id)
	}
}
