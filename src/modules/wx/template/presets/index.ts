import { ABSTRACT_BRAIN_HOLE_PRESET } from './abstract-brain-hole.preset'
import { BEFORE_MARRIAGE_PRESET } from './before-marriage.preset'
import { BEFORE_RELATIONSHIP_PRESET } from './before-relationship.preset'
import { BLANK_TEMPLATE_PRESET } from './blank.preset'
import { BLIND_DATE_BEFORE_MEETING_PRESET } from './blind-date-before-meeting.preset'
import { FIRST_DATE_TEMPLATE_PRESET } from './first-date.preset'
import { LOVE_LANGUAGE_TEMPLATE_PRESET } from './love-language.preset'
import { WEEKEND_TEMPLATE_PRESET } from './weekend.preset'
import type { WxSystemTemplatePreset } from './wx-template-preset.types'

export const WX_SYSTEM_TEMPLATE_PRESETS: WxSystemTemplatePreset[] = [
	BLANK_TEMPLATE_PRESET,
	ABSTRACT_BRAIN_HOLE_PRESET,
	FIRST_DATE_TEMPLATE_PRESET,
	LOVE_LANGUAGE_TEMPLATE_PRESET,
	WEEKEND_TEMPLATE_PRESET,
	BLIND_DATE_BEFORE_MEETING_PRESET,
	BEFORE_RELATIONSHIP_PRESET,
	BEFORE_MARRIAGE_PRESET,
]
