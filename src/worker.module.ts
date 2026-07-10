import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './core/database/database.module'
import { AppLoggerModule } from './core/logger/logger.module'
import { ImageWorkerModule } from './modules/image/image-worker.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		AppLoggerModule,
		DatabaseModule,
		ImageWorkerModule,
	],
})
export class WorkerModule {}
