import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import Redis from 'ioredis'

@Injectable()
export class RedisService implements OnModuleDestroy {
	private readonly logger = new Logger(RedisService.name)
	private readonly client: Redis

	constructor(private readonly configService: ConfigService) {
		this.client = new Redis({
			host: this.configService.getOrThrow<string>('REDIS_HOST'),
			port: Number(this.configService.get<string>('REDIS_PORT')),
			password: this.configService.get<string>('REDIS_PASSWORD'),
			db: Number(this.configService.get<string>('REDIS_DB')),
			lazyConnect: false,
			retryStrategy(times) {
				const delay = Math.min(times * 50, 2000)
				return delay
			},
			connectTimeout: 10000,
		})

		this.client.on('ready', () => {
			this.logger.log('[Redis 连接成功]')
		})
		this.client.on('error', (error: Error) => {
			this.logger.error('[Redis 连接失败]', error.stack)
		})
	}

	getClient(): Redis {
		return this.client
	}

	onModuleDestroy() {
		return this.client.quit()
	}
}
