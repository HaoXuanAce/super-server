import { SetMetadata } from '@nestjs/common'

export const SKIP_RESPONSE_WRAP_KEY = 'skip-response-wrap'

export const SkipResponseWrap = () =>
	SetMetadata(SKIP_RESPONSE_WRAP_KEY, true)
