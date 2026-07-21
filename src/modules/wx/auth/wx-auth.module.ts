import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { JwtModule } from '@nestjs/jwt'
import { PassportModule } from '@nestjs/passport'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WxUserEntity } from '../entities/wx-user.entity'
import { getWxJwtSecret } from './wx-auth.config'
import { WxAuthController } from './wx-auth.controller'
import { WxAuthService } from './wx-auth.service'
import { WxJwtAuthGuard } from './wx-jwt-auth.guard'
import { WxJwtStrategy } from './wx-jwt.strategy'

@Module({
	imports: [
		ConfigModule,
		PassportModule,
		TypeOrmModule.forFeature([WxUserEntity]),
		JwtModule.registerAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => ({
				secret: getWxJwtSecret(configService),
				signOptions: { expiresIn: '7d' },
			}),
		}),
	],
	controllers: [WxAuthController],
	providers: [WxAuthService, WxJwtStrategy, WxJwtAuthGuard],
	exports: [WxJwtAuthGuard],
})
export class WxAuthModule {}
