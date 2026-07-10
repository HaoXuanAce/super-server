import { Module } from '@nestjs/common'
import { TaskModule } from 'src/modules/task/task.module'
import { AiModule } from '../ai/ai.module'
import { ImageController } from './image.controller'
import { ImageQueueService } from './image-queue.service'
import { ImageService } from './image.service'
import { DoubaoImageProvider } from './providers/doubao.provider'
import { GptImageProvider } from './providers/gpt.provider'

@Module({
	imports: [AiModule, TaskModule],
	controllers: [ImageController],
	providers: [
		ImageService,
		ImageQueueService,
		GptImageProvider,
		DoubaoImageProvider,
	],
	exports: [ImageService, ImageQueueService],
})
export class ImageModule {}
