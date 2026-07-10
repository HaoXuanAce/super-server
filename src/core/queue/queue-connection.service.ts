import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'

@Injectable()
export class QueueConnectionService {
	constructor(private readonly configService: ConfigService) {}

	createQueueConnection() {
		return this.getConnectionOptions()
	}

	createWorkerConnection() {
		return {
			...this.getConnectionOptions(),
			maxRetriesPerRequest: null,
		}
	}

	private getConnectionOptions() {
		return {
			host: this.configService.getOrThrow<string>('REDIS_HOST'),
			port: Number(this.configService.getOrThrow<string>('REDIS_PORT')),
			password: this.configService.get<string>('REDIS_PASSWORD'),
			db: Number(this.configService.getOrThrow<string>('REDIS_DB')),
		}
	}
}
