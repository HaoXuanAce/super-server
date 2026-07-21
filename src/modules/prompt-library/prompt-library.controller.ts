import { Controller, Get } from '@nestjs/common'
import { PromptLibraryService } from './prompt-library.service'

@Controller('prompt-library')
export class PromptLibraryController {
	constructor(private readonly promptLibraryService: PromptLibraryService) {}

	@Get()
	findOptions() {
		return this.promptLibraryService.findOptions()
	}
}
