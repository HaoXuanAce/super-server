import { Module } from '@nestjs/common'
import { AiModule } from '../ai/ai.module'
import { ImageController } from './image.controller'
import { ImageService } from './image.service'
import { DoubaoImageProvider } from './providers/doubao.provider'
import { GptImageProvider } from './providers/gpt.provider'

@Module({
	imports: [AiModule],
	controllers: [ImageController],
	providers: [ImageService, GptImageProvider, DoubaoImageProvider],
	exports: [ImageService],
})
export class ImageModule {}
