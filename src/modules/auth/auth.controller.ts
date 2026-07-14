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
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import type { AuthenticatedRequest } from './auth.types'
import { AuthService } from './auth.service'
import { PasswordLoginDto } from './dto/password-login.dto'
import { PhoneLoginDto } from './dto/phone-login.dto'
import { RegisterDto } from './dto/register.dto'
import { RequestPhoneCodeDto } from './dto/request-phone-code.dto'
import { JwtAuthGuard } from './jwt-auth.guard'

@ApiTags('auth')
@Controller('auth')
export class AuthController {
	constructor(private readonly authService: AuthService) {}

	@Post('register')
	@ApiOperation({ summary: '邮箱密码注册' })
	register(@Body() dto: RegisterDto) {
		return this.authService.register(dto)
	}

	@Post('login/password')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: '邮箱密码登录' })
	loginWithPassword(@Body() dto: PasswordLoginDto) {
		return this.authService.loginWithPassword(dto)
	}

	@Post('phone-code')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: '获取手机验证码' })
	async requestPhoneCode(@Body() dto: RequestPhoneCodeDto) {
		await this.authService.requestPhoneCode(dto.phone)
		return { expiresIn: 300 }
	}

	@Post('login/phone')
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: '手机号验证码登录或注册' })
	loginWithPhone(@Body() dto: PhoneLoginDto) {
		return this.authService.loginWithPhone(dto)
	}

	@Get('me')
	@UseGuards(JwtAuthGuard)
	@ApiBearerAuth()
	@ApiOperation({ summary: '获取当前登录用户' })
	getProfile(@Req() request: AuthenticatedRequest) {
		return this.authService.getProfile(request.user.id)
	}
}
