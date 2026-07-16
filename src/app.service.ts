import { Injectable } from '@nestjs/common'

export interface HelloResponse {
	message: string
}

@Injectable()
export class AppService {
	getHello(): HelloResponse {
		return {
			message: 'Hello World!',
		}
	}
}
