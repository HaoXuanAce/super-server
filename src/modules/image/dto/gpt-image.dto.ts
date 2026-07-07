import { ImageModel } from '../enums/image-model.enum'

export class GptImageDto {
  model = ImageModel.GPT

  prompt!: string

  size?: '1024x1024' | '1792x1024' | '1024x1792'

  quality?: 'standard' | 'hd'
}
