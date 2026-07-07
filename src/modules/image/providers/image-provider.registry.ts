import { Injectable, NotFoundException } from '@nestjs/common'
import { ImageModel } from '../enums/image-model.enum'
import { ImageProvider } from '../interfaces/image-provider.interface'
import { GptImageProvider } from './gpt.provider'
import { SeedanceImageProvider } from './seedance.provider'

@Injectable()
export class ImageProviderRegistry {
	private readonly map: Map<ImageModel, ImageProvider>

	constructor(gpt: GptImageProvider, seedance: SeedanceImageProvider) {
		const providers: Array<[ImageModel, ImageProvider]> = [
			[gpt.model, gpt],
			[seedance.model, seedance],
		]
		this.map = new Map(providers)
	}

	resolve(model: ImageModel): ImageProvider {
		const provider = this.map.get(model)
		if (!provider) {
			throw new NotFoundException(
				`no image provider for model "${model}"`,
			)
		}
		return provider
	}
}
