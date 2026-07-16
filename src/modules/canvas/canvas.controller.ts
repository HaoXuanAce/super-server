import { Body, Controller, Param, Patch, Req, UseGuards } from '@nestjs/common'
import type { AuthenticatedRequest } from '../auth/auth.types'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { SaveCanvasChangesDto } from './dto/save-canvas-changes.dto'
import { CanvasService } from './canvas.service'

@Controller('canvases')
@UseGuards(JwtAuthGuard)
export class CanvasController {
	constructor(private readonly canvasService: CanvasService) {}

	@Patch(':canvasId/changes')
	saveChanges(
		@Param('canvasId') canvasId: string,
		@Body() dto: SaveCanvasChangesDto,
		@Req() request: AuthenticatedRequest,
	) {
		return this.canvasService.saveChanges({
			canvasId,
			baseVersion: dto.baseVersion,
			changes: {
				nodes: dto.nodes,
				edges: dto.edges,
			},
			userId: request.user.id,
		})
	}
}
