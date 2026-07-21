import { Module } from '@nestjs/common'
import { WxAnswerModule } from './answer/wx-answer.module'
import { WxAuthModule } from './auth/wx-auth.module'
import { WxQuestionnaireModule } from './questionnaire/wx-questionnaire.module'
import { WxShareModule } from './share/wx-share.module'
import { WxTemplateModule } from './template/wx-template.module'
import { WxController } from './wx.controller'
import { WxService } from './wx.service'

@Module({
	imports: [
		WxAuthModule,
		WxTemplateModule,
		WxQuestionnaireModule,
		WxAnswerModule,
		WxShareModule,
	],
	controllers: [WxController],
	providers: [WxService],
})
export class WxModule {}
