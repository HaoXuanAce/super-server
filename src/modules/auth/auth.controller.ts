import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Post,
	Req,
	UseGuards,
} from '@nestjs/common'
import type { AuthenticatedRequest } from './auth.types'
import { AuthService } from './auth.service'
import { PasswordLoginDto } from './dto/password-login.dto'
import { PhoneLoginDto } from './dto/phone-login.dto'
import { RegisterDto } from './dto/register.dto'
import { RequestPhoneCodeDto } from './dto/request-phone-code.dto'
import { JwtAuthGuard } from './jwt-auth.guard'

@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	register(@Body() dto: RegisterDto) {
		return this.authService.register(dto)
	}

	@Post('login/password')
	@HttpCode(HttpStatus.OK)
	loginWithPassword(@Body() dto: PasswordLoginDto) {
		return this.authService.loginWithPassword(dto)
	}

	@Post('phone-code')
	@HttpCode(HttpStatus.OK)
	async requestPhoneCode(@Body() dto: RequestPhoneCodeDto) {
		await this.authService.requestPhoneCode(dto.phone)
		return { expiresIn: 300 }
	}

	@Post('login/phone')
	@HttpCode(HttpStatus.OK)
	loginWithPhone(@Body() dto: PhoneLoginDto) {
		return this.authService.loginWithPhone(dto)
	}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	getProfile(@Req() request: AuthenticatedRequest) {
		return this.authService.getProfile(request.user.id)
	}
}
