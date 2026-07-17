import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common'
import type { AuthenticatedRequest } from '../auth/auth.types'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { CreateImageDto } from './dto/create-image.dto'
import { ImageService } from './image.service'

@Controller('images')
@UseGuards(JwtAuthGuard)
export class ImageController {
	constructor(private readonly imageService: ImageService) {}

	@Post()
	generate(
		@Body() dto: CreateImageDto,
		@Req() request: AuthenticatedRequest,
	) {
		return this.imageService.submit(request.user.id, dto)
	}
}
