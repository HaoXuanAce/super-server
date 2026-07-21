import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WxAuthModule } from '../auth/wx-auth.module'
import { WxAnswerEntity } from '../entities/wx-answer.entity'
import { WxShareEntity } from '../entities/wx-share.entity'
import { WxUserEntity } from '../entities/wx-user.entity'
import { WxAnswerController } from './wx-answer.controller'
import { WxAnswerService } from './wx-answer.service'

@Module({
	imports: [
		WxAuthModule,
		TypeOrmModule.forFeature([WxAnswerEntity, WxShareEntity, WxUserEntity]),
	],
	controllers: [WxAnswerController],
	providers: [WxAnswerService],
})
export class WxAnswerModule {}
