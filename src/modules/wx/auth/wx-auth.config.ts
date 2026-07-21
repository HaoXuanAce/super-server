import type { ConfigService } from '@nestjs/config'

export function getWxJwtSecret(configService: ConfigService): string {
	return (
		configService.get<string>('WX_JWT_SECRET') ??
		configService.getOrThrow<string>('JWT_SECRET')
	)
}
