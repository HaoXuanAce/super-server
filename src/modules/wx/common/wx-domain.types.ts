import type {
	WX_QUESTIONNAIRE_STATUSES,
	WX_SHARE_TYPES,
	WX_TEMPLATE_CATEGORIES,
	WX_USER_STATUSES,
} from '../wx.constants'

export type WxJsonContent = Record<string, unknown>

export type WxQuestionnaireStatus = (typeof WX_QUESTIONNAIRE_STATUSES)[number]

export type WxShareType = (typeof WX_SHARE_TYPES)[number]

export type WxTemplateCategory = (typeof WX_TEMPLATE_CATEGORIES)[number]

export type WxUserStatus = (typeof WX_USER_STATUSES)[number]
