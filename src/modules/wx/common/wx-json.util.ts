import type { WxJsonContent } from './wx-domain.types'

export function cloneWxJsonContent(content: WxJsonContent): WxJsonContent {
	return structuredClone(content)
}
