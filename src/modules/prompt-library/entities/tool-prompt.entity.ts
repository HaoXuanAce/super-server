import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryColumn,
	UpdateDateColumn,
} from 'typeorm'

@Entity('tool_prompt')
@Index(['category', 'sortOrder'])
export class ToolPromptEntity {
	@PrimaryColumn({ type: 'varchar', length: 64 })
	id!: string

	@Index()
	@Column({ type: 'varchar', length: 191 })
	name!: string

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
