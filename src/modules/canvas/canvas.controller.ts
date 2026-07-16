import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common'
import type { AuthenticatedRequest } from '../auth/auth.types'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { SaveCanvasChangesDto } from './dto/save-canvas-changes.dto'
import { CanvasService } from './canvas.service'

@Controller('canvas')
@UseGuards(JwtAuthGuard)
export class CanvasController {
	constructor(private readonly canvasService: CanvasService) {}

	@Get('detail')
	findOne(@Req() req: AuthenticatedRequest) {
		return this.canvasService.findCanvasByUser(req.user.id)
	}

	@Post('update')
	saveChanges(
		@Body() dto: SaveCanvasChangesDto,
		@Req() request: AuthenticatedRequest,
	) {
		return this.canvasService.saveChanges({
			baseVersion: dto.baseVersion,
			changes: {
				nodes: dto.nodes,
				edges: dto.edges,
			},
			userId: request.user.id,
		})
	}
}
