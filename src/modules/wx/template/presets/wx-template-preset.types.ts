import type { WxJsonContent } from '../../common/wx-domain.types'
import type { WxTemplateCategory } from '../../common/wx-domain.types'

export type WxPresetQuestionType = 'single' | 'multiple' | 'text'

export interface WxPresetQuestion {
	id: string
	type: WxPresetQuestionType
	title: string
	required: boolean
	options: string[]
}

export interface WxSystemTemplatePreset {
	key: string
	name: string
	description: string
	coverUrl: string | null
	category: WxTemplateCategory
	content: WxJsonContent & {
		questions: WxPresetQuestion[]
		settings: Record<string, unknown>
	}
}
