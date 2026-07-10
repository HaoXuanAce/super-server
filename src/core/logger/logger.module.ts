import { Module } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { join } from 'node:path'
import {
	utilities as nestWinstonModuleUtilities,
	WinstonModule,
} from 'nest-winston'
import { format, transports } from 'winston'
import DailyRotateFile from 'winston-daily-rotate-file'

@Module({
	imports: [
		WinstonModule.forRootAsync({
			imports: [ConfigModule],
			inject: [ConfigService],
			useFactory: (configService: ConfigService) => {
				const isProduction =
					configService.get<string>('NODE_ENV') === 'production'
				const logDir = configService.get<string>('LOG_DIR', '/app/logs')
				const logName = configService.get<string>('LOG_NAME', 'app')

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
					transports: [
						new transports.Console(),
						new DailyRotateFile({
							dirname: join(logDir, logName),
							filename: `%DATE%.${logName}.log`,
							datePattern: 'YYYY-MM-DD',
							maxFiles: '7d',
							auditFile: join(logDir, `.${logName}-audit.json`),
						}),
						new DailyRotateFile({
							dirname: join(logDir, `error-${logName}`),
							filename: `%DATE%.error-${logName}.log`,
							level: 'error',
							datePattern: 'YYYY-MM-DD',
							maxFiles: '7d',
							auditFile: join(
								logDir,
								`.error-${logName}-audit.json`,
							),
						}),
					],
				}
			},
		}),
	],
})
export class AppLoggerModule {}
