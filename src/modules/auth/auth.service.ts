import {
	ConflictException,
	Injectable,
	UnauthorizedException,
} from '@nestjs/common'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { UserEntity } from '../user/entities/user.entity'
import { UserProfile, UserService } from '../user/user.service'
import { PasswordLoginDto } from './dto/password-login.dto'
import { PhoneLoginDto } from './dto/phone-login.dto'
import { RegisterDto } from './dto/register.dto'
import { PhoneCodeService } from './phone-code.service'

export interface AuthResult {
	accessToken: string
	tokenType: 'Bearer'
	user: UserProfile
}

@Injectable()
export class AuthService {
	constructor(
		private readonly userService: UserService,
		private readonly phoneCodeService: PhoneCodeService,
		private readonly jwtService: JwtService,
	) {}

	async register(dto: RegisterDto): Promise<AuthResult> {
		const email = dto.email.trim().toLowerCase()
		const existingUser =
			await this.userService.findByEmailWithPassword(email)
		if (existingUser) {
			throw new ConflictException('该邮箱已注册')
		}

		const passwordHash = await bcrypt.hash(dto.password, 12)
		const user = await this.userService.create({ email, passwordHash })
		return this.createAuthResult(user)
	}

	async loginWithPassword(dto: PasswordLoginDto): Promise<AuthResult> {
		const user = await this.userService.findByEmailWithPassword(
			dto.email.trim().toLowerCase(),
		)
		if (!user?.passwordHash) {
			throw new UnauthorizedException('邮箱或密码错误')
		}

		const isPasswordValid = await bcrypt.compare(
			dto.password,
			user.passwordHash,
		)
		if (!isPasswordValid) {
			throw new UnauthorizedException('邮箱或密码错误')
		}

		return this.createAuthResult(user)
	}

	requestPhoneCode(phone: string): Promise<void> {
		return this.phoneCodeService.requestCode(phone)
	}

	async loginWithPhone(dto: PhoneLoginDto): Promise<AuthResult> {
		await this.phoneCodeService.verifyCode(dto.phone, dto.code)
		let user = await this.userService.findByPhone(dto.phone)
		if (!user) {
			user = await this.userService.create({ phone: dto.phone })
		}

		return this.createAuthResult(user)
	}

	async getProfile(userId: string): Promise<UserProfile> {
		const user = await this.userService.findById(userId)
		if (!user) {
			throw new UnauthorizedException('用户不存在或登录已失效')
		}

		return this.userService.toProfile(user)
	}

	private async createAuthResult(user: UserEntity): Promise<AuthResult> {
		return {
			accessToken: await this.jwtService.signAsync({
				id: user.id,
				email: user.email,
			}),
			tokenType: 'Bearer',
			user: this.userService.toProfile(user),
		}
	}
}
