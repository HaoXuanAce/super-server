import { ImageModel } from '../enums/image-model.enum'
import { ImageResult } from '../interface/image-result.interface'

export interface ImageProvider<TParams = unknown> {
	readonly model: ImageModel
	generate(params: TParams): Promise<ImageResult>
}
