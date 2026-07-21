import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { HotImageEntity } from '../hot-image/entities/hot-image.entity'
import { FilterPromptEntity } from './entities/filter-prompt.entity'
import { ToolPromptEntity } from './entities/tool-prompt.entity'
import { PromptLibraryController } from './prompt-library.controller'
import { PromptLibraryService } from './prompt-library.service'

@Module({
	imports: [
		TypeOrmModule.forFeature([
			FilterPromptEntity,
			ToolPromptEntity,
			HotImageEntity,
		]),
	],
	controllers: [PromptLibraryController],
	providers: [PromptLibraryService],
	exports: [PromptLibraryService],
})
export class PromptLibraryModule {}
