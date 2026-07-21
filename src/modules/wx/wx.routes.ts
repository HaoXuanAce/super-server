import type { Routes } from '@nestjs/core'
import { WxAnswerModule } from './answer/wx-answer.module'
import { WxAuthModule } from './auth/wx-auth.module'
import { WxQuestionnaireModule } from './questionnaire/wx-questionnaire.module'
import { WxShareModule } from './share/wx-share.module'
import { WxTemplateModule } from './template/wx-template.module'
import { WxModule } from './wx.module'

export const WX_ROUTES: Routes = [
	{
		path: 'wx',
		module: WxModule,
		children: [
			{ path: 'auth', module: WxAuthModule },
			{ path: 'templates', module: WxTemplateModule },
			{ path: 'questionnaires', module: WxQuestionnaireModule },
			{ path: 'answers', module: WxAnswerModule },
			{ path: 'shares', module: WxShareModule },
		],
	},
]
