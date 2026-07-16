import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import OSS from 'ali-oss'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { OssUploadedFile } from './oss.types'

export interface UploadedOssFile {
	objectKey: string
	url: string
	previewUrl: string
	name: string
	size: number
	mimeType: string
}

@Injectable()
export class OssService {
	private readonly client: InstanceType<typeof OSS>
	private readonly objectAcl: string | null

	constructor(private readonly configService: ConfigService) {
		const region = this.configService.get<string>('OSS_REGION')
		const accessKeyId = this.configService.get<string>('OSS_ACCESS_KEY_ID')
		const accessKeySecret = this.configService.get<string>(
			'OSS_ACCESS_KEY_SECRET',
		)
		const bucket = this.configService.get<string>('OSS_BUCKET')

		if (!region || !accessKeyId || !accessKeySecret || !bucket) {
			throw new Error(
				'OSS 配置缺失，请检查 OSS_REGION、OSS_ACCESS_KEY_ID、OSS_ACCESS_KEY_SECRET、OSS_BUCKET',
			)
		}

		this.client = new OSS({
			region,
			accessKeyId,
			accessKeySecret,
			bucket,
			authorizationV4: true,
			secure: true,
		})
		this.objectAcl =
			this.configService.get<string>('OSS_OBJECT_ACL') ?? null
	}

	async uploadFiles(
		files: OssUploadedFile[] | undefined,
	): Promise<UploadedOssFile[]> {
		if (!files?.length) {
			throw new BadRequestException('请选择要上传的文件')
		}

		if (files.length > 10) {
			throw new BadRequestException('每次最多上传 10 个文件')
		}

		const oversizedFile = files.find((file) => file.size > 20 * 1024 * 1024)
		if (oversizedFile) {
			throw new BadRequestException('单个文件大小不能超过 20MB')
		}

		return Promise.all(files.map((file) => this.uploadFile(file)))
	}

	private async uploadFile(file: OssUploadedFile): Promise<UploadedOssFile> {
		const objectKey = this.createObjectKey(file.originalname)
		const headers = this.createPutObjectHeaders(file.mimetype)

		try {
			const result = await this.client.put(objectKey, file.buffer, {
				headers,
			})

			return {
				objectKey,
				url: result.url,
				previewUrl: this.createPreviewUrl(objectKey, result.url),
				name: file.originalname,
				size: file.size,
				mimeType: file.mimetype,
			}
		} catch (error) {
			throw new InternalServerErrorException(
				this.getUploadErrorMessage(error),
			)
		}
	}

	private createPutObjectHeaders(mimeType: string): Record<string, string> {
		const headers: Record<string, string> = {
			'Content-Type': mimeType,
			'x-oss-storage-class': 'Standard',
			'x-oss-forbid-overwrite': 'true',
		}

		if (this.objectAcl) {
			headers['x-oss-object-acl'] = this.objectAcl
		}

		return headers
	}

	private createPreviewUrl(objectKey: string, url: string): string {
		if (this.objectAcl !== 'private') {
			return url
		}

		return this.client.signatureUrl(objectKey, {
			expires: 60 * 60,
			method: 'GET',
		})
	}

	private createObjectKey(originalName: string): string {
		const ext = path.extname(originalName)
		const now = new Date()
		const year = now.getFullYear()
		const month = String(now.getMonth() + 1).padStart(2, '0')
		const day = String(now.getDate()).padStart(2, '0')
		const date = `${year}-${month}-${day}`

		return `image/${date}/${randomUUID()}${ext}`
	}

	private getUploadErrorMessage(error: unknown): string {
		if (
			typeof error === 'object' &&
			error !== null &&
			'message' in error &&
			typeof error.message === 'string'
		) {
			return `OSS 上传失败：${error.message}`
		}

		return 'OSS 上传失败'
	}
}
