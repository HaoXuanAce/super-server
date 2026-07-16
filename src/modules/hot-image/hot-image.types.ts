export const HOT_IMAGE_TYPES = [
	'人像写真',
	'风景旅行',
	'营销',
	'创意',
	'封面',
	'热梗',
	'表情包',
] as const

export const HOT_IMAGE_QUERY_TYPES = ['全部', ...HOT_IMAGE_TYPES] as const

export type HotImageType = (typeof HOT_IMAGE_TYPES)[number]
export type HotImageQueryType = (typeof HOT_IMAGE_QUERY_TYPES)[number]
