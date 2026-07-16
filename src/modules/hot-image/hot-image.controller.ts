import { Controller, Get, Query } from '@nestjs/common'
import { QueryHotImagesDto } from './dto/query-hot-images.dto'
import { HotImageService } from './hot-image.service'

@Controller('hot-images')
export class HotImageController {
	constructor(private readonly hotImageService: HotImageService) {}

	@Get()
	findAll(@Query() query: QueryHotImagesDto) {
		return this.hotImageService.findAll(query)
	}
}
