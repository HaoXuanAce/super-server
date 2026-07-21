import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Put,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common'
import { UpdateWxProfileDto } from './dto/update-wx-profile.dto'
import { WxLoginDto } from './dto/wx-login.dto'
import { WxAuthService } from './wx-auth.service'
import type { WxAuthenticatedRequest } from './wx-auth.types'
import { WxJwtAuthGuard } from './wx-jwt-auth.guard'

@Controller()
export class WxAuthController {
	constructor(private readonly authService: WxAuthService) {}

	@Post('login')
	@HttpCode(HttpStatus.OK)
	login(@Body() dto: WxLoginDto) {
		return this.authService.login(dto)
	}

	@Get('me')
	@UseGuards(WxJwtAuthGuard)
	getProfile(@Req() request: WxAuthenticatedRequest) {
		return this.authService.getProfile(request.user.id)
	}

	@Put('me')
	@UseGuards(WxJwtAuthGuard)
	updateProfile(
		@Req() request: WxAuthenticatedRequest,
		@Body() dto: UpdateWxProfileDto,
	) {
		return this.authService.updateProfile(request.user.id, dto)
	}
}
