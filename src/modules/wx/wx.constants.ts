export const WX_QUESTIONNAIRE_STATUSES = [
	'draft',
	'published',
	'closed',
] as const

export const WX_SHARE_TYPES = ['questionnaire', 'answer'] as const

export const WX_USER_STATUSES = ['active', 'disabled'] as const

export const WX_TEMPLATE_CATEGORIES = [
	'abstract',
	'boyfriend_challenge',
	'first_meeting',
	'make_friends',
	'blind_date',
	'marriage',
	'men',
] as const

export const WX_TEMPLATE_CATEGORY_OPTIONS = [
	{ value: 'abstract', label: '抽象题库' },
	{ value: 'boyfriend_challenge', label: '折磨男朋友题库' },
	{ value: 'first_meeting', label: '初认识题库' },
	{ value: 'make_friends', label: '结交朋友题库' },
	{ value: 'blind_date', label: '相亲题库' },
	{ value: 'marriage', label: '结婚题库' },
	{ value: 'men', label: '男生题库' },
] as const
