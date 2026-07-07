import { Body, Controller, Post } from '@nestjs/common'

import type { CreateImageDto } from './dto/create-image.dto'
import { ImageService } from './image.service'

@Controller('images')
export class ImageController {
	constructor(private readonly imageService: ImageService) {}

	// 生成图片
	@Post()
	generate(@Body() dto: CreateImageDto) {
		return this.imageService.create(dto)
	}
}
