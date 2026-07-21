import {
	BadGatewayException,
	Injectable,
	NotFoundException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import { InjectRepository } from '@nestjs/typeorm'
import axios from 'axios'
import { Repository } from 'typeorm'
import { WxUserEntity } from '../entities/wx-user.entity'
import type { UpdateWxProfileDto } from './dto/update-wx-profile.dto'
import type { WxLoginDto } from './dto/wx-login.dto'
import type {
	WxAuthResult,
	WxCode2SessionResponse,
	WxJwtPayload,
	WxUserProfile,
} from './wx-auth.types'

@Injectable()
export class WxAuthService {
	constructor(
		private readonly configService: ConfigService,
		private readonly jwtService: JwtService,
		@InjectRepository(WxUserEntity)
		private readonly userRepository: Repository<WxUserEntity>,
	) {}

	async login(dto: WxLoginDto): Promise<WxAuthResult> {
		const session = await this.exchangeCode(dto.code)
		const user = await this.upsertUser(
			session.openid!,
			session.unionid ?? null,
			dto,
		)
		const payload: WxJwtPayload = {
			sub: user.id,
			platform: 'wx',
		}

		return {
			accessToken: await this.jwtService.signAsync(payload),
			tokenType: 'Bearer',
			user: this.toProfile(user),
		}
	}

	async getProfile(userId: string): Promise<WxUserProfile> {
		const user = await this.findActiveUser(userId)
		return this.toProfile(user)
	}

	async updateProfile(
		userId: string,
		dto: UpdateWxProfileDto,
	): Promise<WxUserProfile> {
		const user = await this.findActiveUser(userId)
		if (dto.nickname !== undefined) user.nickname = dto.nickname.trim()
		if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl

		return this.toProfile(await this.userRepository.save(user))
	}

	private async exchangeCode(code: string): Promise<WxCode2SessionResponse> {
		try {
			const response = await axios.get<WxCode2SessionResponse>(
				'https://api.weixin.qq.com/sns/jscode2session',
				{
					params: {
						appid: this.configService.getOrThrow<string>('WX_APP_ID'),
						secret:
							this.configService.getOrThrow<string>('WX_APP_SECRET'),
						js_code: code,
						grant_type: 'authorization_code',
					},
					timeout: 10000,
				},
			)

			if (response.data.errcode || !response.data.openid) {
				throw new BadGatewayException(
					`微信登录失败：${response.data.errmsg ?? '未获取到 openid'}`,
				)
			}

			return response.data
		} catch (error) {
			if (error instanceof BadGatewayException) throw error
			throw new BadGatewayException('微信登录服务暂时不可用')
		}
	}

	private async upsertUser(
		openId: string,
		unionId: string | null,
		dto: WxLoginDto,
	): Promise<WxUserEntity> {
		let user = await this.userRepository.findOneBy({ openId })
		if (!user) {
			user = this.userRepository.create({
				openId,
				unionId,
				nickname: dto.nickname?.trim() ?? null,
				avatarUrl: dto.avatarUrl ?? null,
				status: 'active',
				lastLoginAt: new Date(),
			})
		} else {
			user.unionId = unionId ?? user.unionId
			user.lastLoginAt = new Date()
			if (dto.nickname !== undefined) user.nickname = dto.nickname.trim()
			if (dto.avatarUrl !== undefined) user.avatarUrl = dto.avatarUrl
		}

		try {
			return await this.userRepository.save(user)
		} catch (error) {
			if (!this.isDuplicateEntryError(error)) throw error
			const existingUser = await this.userRepository.findOneBy({ openId })
			if (!existingUser) throw error
			return existingUser
		}
	}

	private async findActiveUser(userId: string): Promise<WxUserEntity> {
		const user = await this.userRepository.findOneBy({
			id: userId,
			status: 'active',
		})
		if (!user) {
			throw new NotFoundException('小程序用户不存在或已被禁用')
		}
		return user
	}

	private toProfile(user: WxUserEntity): WxUserProfile {
		return {
			id: user.id,
			nickname: user.nickname,
			avatarUrl: user.avatarUrl,
			status: user.status,
			lastLoginAt: user.lastLoginAt,
			createdAt: user.createdAt,
		}
	}

	private isDuplicateEntryError(error: unknown): boolean {
		return (
			typeof error === 'object' &&
			error !== null &&
			(error as { code?: string }).code === 'ER_DUP_ENTRY'
		)
	}
}
