import {
	Injectable,
	HttpException,
	HttpStatus,
	Logger,
	UnauthorizedException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { createHash, randomInt, timingSafeEqual } from 'node:crypto'
import type { PhoneCodeRecord } from 'src/common/interface/phone-code.interface'
import { RedisService } from '../../core/redis/redis.service'

@Injectable()
export class PhoneCodeService {
	private readonly logger = new Logger(PhoneCodeService.name)
	private readonly ttlSeconds = 300
	private readonly maxAttempts = 5

	constructor(
		private readonly redisService: RedisService,
		private readonly configService: ConfigService,
	) {}

	async requestCode(phone: string): Promise<void> {
		const code = randomInt(100000, 1_000_000).toString()
		const record: PhoneCodeRecord = {
			hash: this.hash(phone, code),
			attempts: 0,
		}
		await this.redisService
			.getClient()
			.set(this.key(phone), JSON.stringify(record), 'EX', this.ttlSeconds)

		if (this.configService.get<string>('NODE_ENV') !== 'production') {
			this.logger.debug(`开发验证码：${phone} -> ${code}`)
		}
	}

	async verifyCode(phone: string, code: string): Promise<void> {
		const client = this.redisService.getClient()
		const rawRecord = await client.get(this.key(phone))
		if (!rawRecord) {
			throw new UnauthorizedException('验证码已过期或不存在')
		}

		const record = JSON.parse(rawRecord) as PhoneCodeRecord
		if (record.attempts >= this.maxAttempts) {
			await client.del(this.key(phone))
			throw new HttpException(
				'验证码尝试次数过多，请重新获取',
				HttpStatus.TOO_MANY_REQUESTS,
			)
		}

		const isValid = this.isHashEqual(record.hash, this.hash(phone, code))
		if (!isValid) {
			const remainingTtl = await client.ttl(this.key(phone))
			record.attempts += 1
			await client.set(
				this.key(phone),
				JSON.stringify(record),
				'EX',
				Math.max(remainingTtl, 1),
			)
			throw new UnauthorizedException('验证码错误')
		}

		await client.del(this.key(phone))
	}

	private key(phone: string): string {
		return `auth:phone-code:${phone}`
	}

	private hash(phone: string, code: string): string {
		const secret = this.configService.getOrThrow<string>('JWT_SECRET')
		return createHash('sha256')
			.update(`${phone}:${code}:${secret}`)
			.digest('hex')
	}

	private isHashEqual(left: string, right: string): boolean {
		return timingSafeEqual(Buffer.from(left), Buffer.from(right))
	}
}
