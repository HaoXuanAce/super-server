import { Module } from '@nestjs/common'
import { AiModule } from '../ai/ai.module'
import { ImageService } from './image.service'
import { ImageProviderRegistry } from './providers/image-provider.registry'
import { GptImageProvider } from './providers/gpt.provider'
import { SeedanceImageProvider } from './providers/seedance.provider'

@Module({
	imports: [AiModule],
	providers: [
		ImageService,
		ImageProviderRegistry,
		GptImageProvider,
		SeedanceImageProvider,
	],
	exports: [ImageService],
})
export class ImageModule {}
