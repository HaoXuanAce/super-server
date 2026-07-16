import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { CanvasEdgeEntity } from './entities/canvas-edge.entity'
import { CanvasEntity } from './entities/canvas.entity'
import { CanvasNodeEntity } from './entities/canvas-node.entity'
import { CanvasVersionEntity } from './entities/canvas-version.entity'
import { CanvasController } from './canvas.controller'
import { CanvasService } from './canvas.service'

@Module({
	imports: [
		TypeOrmModule.forFeature([
			CanvasEntity,
			CanvasNodeEntity,
			CanvasEdgeEntity,
			CanvasVersionEntity,
		]),
	],
	controllers: [CanvasController],
	providers: [CanvasService],
	exports: [CanvasService],
})
export class CanvasModule {}
