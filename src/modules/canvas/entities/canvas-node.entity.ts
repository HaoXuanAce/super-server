import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	Index,
	PrimaryColumn,
	UpdateDateColumn,
} from 'typeorm'

@Entity('canvas_node')
@Index(['canvasId', 'deletedAt'])
export class CanvasNodeEntity {
	@PrimaryColumn({ type: 'varchar', length: 36 })
	canvasId!: string

	@PrimaryColumn({ type: 'varchar', length: 191 })
	nodeId!: string

	@Column({ type: 'varchar', length: 64 })
	type!: string

	@Column({ type: 'decimal', precision: 16, scale: 4 })
	positionX!: string

	@Column({ type: 'decimal', precision: 16, scale: 4 })
	positionY!: string

	@Column({ type: 'json' })
	data!: object

	@Column({ type: 'json', nullable: true })
	style!: object | null

	@Column({ type: 'decimal', precision: 16, scale: 4, nullable: true })
	width!: string | null

	@Column({ type: 'decimal', precision: 16, scale: 4, nullable: true })
	height!: string | null

	@Column({ type: 'bigint', unsigned: true })
	createdVersion!: string

	@Column({ type: 'bigint', unsigned: true })
	updatedVersion!: string

	@DeleteDateColumn({ nullable: true })
	deletedAt!: Date | null

	@CreateDateColumn()
	createdAt!: Date

	@UpdateDateColumn()
	updatedAt!: Date
}
