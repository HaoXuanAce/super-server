import {
	Controller,
	Post,
	UploadedFiles,
	UseInterceptors,
	UseGuards,
} from '@nestjs/common'
import { FilesInterceptor } from '@nestjs/platform-express'
import { JwtAuthGuard } from '../auth/jwt-auth.guard'
import { OssService } from './oss.service'
import type { OssUploadedFile } from './oss.types'

@Controller('oss')
@UseGuards(JwtAuthGuard)
export class OssController {
	constructor(private readonly ossService: OssService) {}

	@Post('upload')
	@UseInterceptors(
		FilesInterceptor('files', 10, {
			limits: {
				fileSize: 20 * 1024 * 1024,
				files: 10,
			},
		}),
	)
	upload(@UploadedFiles() files: OssUploadedFile[]) {
		return this.ossService.uploadFiles(files)
	}
}
