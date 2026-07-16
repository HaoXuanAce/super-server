import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { QueryHotImagesDto } from './dto/query-hot-images.dto'
import { HotImageEntity } from './entities/hot-image.entity'

@Injectable()
export class HotImageService {
	constructor(
		@InjectRepository(HotImageEntity)
		private readonly hotImageRepository: Repository<HotImageEntity>,
	) {}

	async findAll(query: QueryHotImagesDto) {
		const queryBuilder = this.hotImageRepository
			.createQueryBuilder('hotImage')
			.orderBy('hotImage.id', 'ASC')
			.skip((query.page - 1) * query.pageSize)
			.take(query.pageSize)

		if (query.type && query.type !== '全部') {
			queryBuilder.andWhere('hotImage.type = :type', { type: query.type })
		}

		const keyword = query.keyword?.trim()
		if (keyword) {
			queryBuilder.andWhere('hotImage.name LIKE :keyword', {
				keyword: `%${keyword}%`,
			})
		}

		const [items, total] = await queryBuilder.getManyAndCount()

		return {
			items,
			total,
			page: query.page,
			pageSize: query.pageSize,
		}
	}
}
