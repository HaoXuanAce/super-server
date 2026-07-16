import { Column, CreateDateColumn, Entity, PrimaryColumn } from 'typeorm'

@Entity('canvas_version')
export class CanvasVersionEntity {
	@PrimaryColumn({ type: 'varchar', length: 36 })
	canvasId!: string

	@PrimaryColumn({ type: 'bigint', unsigned: true })
	version!: string

	@Column({ type: 'bigint', unsigned: true })
	baseVersion!: string

	@Column({ type: 'json' })
	operation!: object

	@Column({ type: 'json', nullable: true })
	snapshot!: object | null

	@Column({ type: 'varchar', length: 36, nullable: true })
	createdByUserId!: string | null

	@CreateDateColumn()
	createdAt!: Date
}
