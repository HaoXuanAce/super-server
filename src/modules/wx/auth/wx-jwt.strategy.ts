import { Injectable, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { Repository } from 'typeorm'
import { WxUserEntity } from '../entities/wx-user.entity'
import { getWxJwtSecret } from './wx-auth.config'
import type { WxAuthenticatedUser, WxJwtPayload } from './wx-auth.types'

@Injectable()
export class WxJwtStrategy extends PassportStrategy(Strategy, 'wx-jwt') {
	constructor(
		configService: ConfigService,
		@InjectRepository(WxUserEntity)
		private readonly userRepository: Repository<WxUserEntity>,
	) {
		super({
			jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
			ignoreExpiration: false,
			secretOrKey: getWxJwtSecret(configService),
		})
	}

	async validate(payload: WxJwtPayload): Promise<WxAuthenticatedUser> {
		if (payload.platform !== 'wx' || !payload.sub) {
			throw new UnauthorizedException('无效的小程序登录凭证')
		}

		const user = await this.userRepository.findOneBy({
			id: payload.sub,
			status: 'active',
		})
		if (!user) {
			throw new UnauthorizedException('小程序用户不存在或已被禁用')
		}

		return { id: user.id }
	}
}
