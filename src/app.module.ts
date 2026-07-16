import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter'
import { ResponseInterceptor } from './common/interceptors/response.interceptor'
import { DatabaseModule } from './core/database/database.module'
import { AppLoggerModule } from './core/logger/logger.module'
import { RedisModule } from './core/redis/redis.module'
import { AiModule } from './modules/ai/ai.module'
import { AuthModule } from './modules/auth/auth.module'
import { CanvasModule } from './modules/canvas/canvas.module'
import { HotImageModule } from './modules/hot-image/hot-image.module'
import { ImageModule } from './modules/image/image.module'
import { OssModule } from './modules/oss/oss.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		AppLoggerModule,
		AiModule,
		AuthModule,
		DatabaseModule,
		RedisModule,
		ImageModule,
		CanvasModule,
		HotImageModule,
		OssModule,
	],
	controllers: [AppController],
	providers: [
		AppService,
		{
			provide: APP_INTERCEPTOR,
			useClass: ResponseInterceptor,
		},
		{
			provide: APP_FILTER,
			useClass: AllExceptionsFilter,
		},
	],
})
export class AppModule {}
