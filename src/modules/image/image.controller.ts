import { Body, Controller, Post } from '@nestjs/common'
import type { CreateImageDto } from './dto/create-image.dto'
import { ImageQueueService } from './image-queue.service'

@Controller('images')
export class ImageController {
	constructor(private readonly imageQueueService: ImageQueueService) {}

	// 生成图片
	@Post()
	generate(@Body() dto: CreateImageDto) {
		return this.imageQueueService.add(dto)
	}
}
