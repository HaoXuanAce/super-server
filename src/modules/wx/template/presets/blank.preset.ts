import type { WxSystemTemplatePreset } from './wx-template-preset.types'

export const BLANK_TEMPLATE_PRESET = {
	key: 'blank',
	name: '空白问卷',
	description: '从空白问卷开始创建。',
	coverUrl: null,
	category: 'abstract',
	content: {
		questions: [],
		settings: {
			category: 'blank',
			estimatedMinutes: 0,
		},
	},
} satisfies WxSystemTemplatePreset
