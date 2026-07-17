import { Injectable } from '@nestjs/common'
import type { HelloResponse } from './common/interface/app.interface'

@Injectable()
export class AppService {
	getHello(): HelloResponse {
		return {
			message: 'Hello World!',
		}
	}
}
