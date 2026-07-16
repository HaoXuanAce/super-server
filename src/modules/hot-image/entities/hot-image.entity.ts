import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm'
import type { HotImageType } from '../hot-image.types'

@Entity('hot_image')
export class HotImageEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Index()
	@Column({ type: 'varchar', length: 191 })
	name!: string

	@Column({ type: 'varchar', length: 2048 })
	url!: string

	@Index()
	@Column({ type: 'varchar', length: 32 })
	type!: HotImageType
}
