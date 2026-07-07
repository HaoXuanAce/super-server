import { ImageModel } from '../enums/image-model.enum'

export class SeedanceImageDto {
  model = ImageModel.SEEDANCE

  prompt!: string

  duration?: number

  aspectRatio?: '16:9' | '9:16' | '1:1'
}
