import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import {
	utilities as nestWinstonModuleUtilities,
	WinstonModule,
} from 'nest-winston'
import { format, transports } from 'winston'

@Module({
	imports: [
		WinstonModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const isProduction =
					configService.get<string>('NODE_ENV') === 'production'

				return {
					level: configService.get<string>(
						'LOG_LEVEL',
						isProduction ? 'info' : 'debug',
					),
					format: format.combine(
						format.timestamp(),
						format.errors({ stack: true }),
						isProduction
							? format.json()
							: nestWinstonModuleUtilities.format.nestLike(
									'SuperServer',
									{
										colors: true,
										prettyPrint: true,
									},
								),
					),
					transports: [new transports.Console()],
				}
			},
		}),
	],
})
export class AppLoggerModule {}
