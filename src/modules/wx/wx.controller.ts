import { Controller, Get } from '@nestjs/common'
import type { WxStatus } from './wx.types'
import { WxService } from './wx.service'

@Controller()
export class WxController {
	constructor(private readonly wxService: WxService) {}

	@Get()
	getStatus(): WxStatus {
		return this.wxService.getStatus()
	}
}
