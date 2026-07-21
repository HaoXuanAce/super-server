import { Injectable } from '@nestjs/common'
import type { WxStatus } from './wx.types'

@Injectable()
export class WxService {
	getStatus(): WxStatus {
		return {
			message: '微信小程序接口运行正常',
		}
	}
}
