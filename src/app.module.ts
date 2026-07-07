import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { AppController } from './app.controller'
import { AppService } from './app.service'
import { DatabaseModule } from './core/database/database.module'
import { AiModule } from './modules/ai/ai.module'
import { ImageModule } from './modules/image/image.module'

@Module({
	imports: [
		ConfigModule.forRoot({
			isGlobal: true,
			envFilePath: '.env',
		}),
		AiModule,
		DatabaseModule,
		ImageModule,
	],
	controllers: [AppController],
	providers: [AppService],
})
export class AppModule {}
