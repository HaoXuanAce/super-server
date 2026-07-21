import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WxAuthModule } from '../auth/wx-auth.module'
import { WxAnswerEntity } from '../entities/wx-answer.entity'
import { WxQuestionnaireEntity } from '../entities/wx-questionnaire.entity'
import { WxShareEntity } from '../entities/wx-share.entity'
import { WxUserEntity } from '../entities/wx-user.entity'
import { WxShareController } from './wx-share.controller'
import { WxShareService } from './wx-share.service'

@Module({
	imports: [
		WxAuthModule,
		TypeOrmModule.forFeature([
			WxShareEntity,
			WxQuestionnaireEntity,
			WxAnswerEntity,
			WxUserEntity,
		]),
	],
	controllers: [WxShareController],
	providers: [WxShareService],
})
export class WxShareModule {}
