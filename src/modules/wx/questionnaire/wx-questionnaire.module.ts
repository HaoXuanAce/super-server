import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { WxAuthModule } from '../auth/wx-auth.module'
import { WxAnswerEntity } from '../entities/wx-answer.entity'
import { WxQuestionnaireEntity } from '../entities/wx-questionnaire.entity'
import { WxShareEntity } from '../entities/wx-share.entity'
import { WxTemplateEntity } from '../entities/wx-template.entity'
import { WxQuestionnaireController } from './wx-questionnaire.controller'
import { WxQuestionnaireService } from './wx-questionnaire.service'

@Module({
	imports: [
		WxAuthModule,
		TypeOrmModule.forFeature([
			WxAnswerEntity,
			WxQuestionnaireEntity,
			WxTemplateEntity,
			WxShareEntity,
		]),
	],
	controllers: [WxQuestionnaireController],
	providers: [WxQuestionnaireService],
})
export class WxQuestionnaireModule {}
