import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { DatabaseModule } from './core/database/database.module'
import { AppLoggerModule } from './core/logger/logger.module'
import { ImageModule } from './modules/image/image.module'
import { ImageGenerationProcessor } from './modules/image/processors/image-generation.processor'
import { TaskModule } from './modules/task/task.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		AppLoggerModule,
		DatabaseModule,
		ImageModule,
		TaskModule,
	],
	providers: [ImageGenerationProcessor],
})
export class WorkerModule {}
