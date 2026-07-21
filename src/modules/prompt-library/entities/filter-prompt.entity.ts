import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryColumn,
	UpdateDateColumn,
} from 'typeorm'

@Entity('filter_prompt')
@Index(['scene', 'sortOrder'])
export class FilterPromptEntity {
	@PrimaryColumn({ type: 'varchar', length: 64 })
	id!: string

	@Index()
	@Column({ type: 'varchar', length: 191 })
	name!: string

	@Column({ type: 'varchar', length: 32 })
	scene!: string

	@Column({ type: 'varchar', length: 64 })
	category!: string

	@Column({ type: 'longtext' })
	prompt!: string

	@Column({ type: 'int', unsigned: true })
	sortOrder!: number

	@Column({ type: 'boolean', default: true })
	isActive!: boolean

	@CreateDateColumn()
	createdAt!: Date

	@UpdateDateColumn()
	updatedAt!: Date
}
