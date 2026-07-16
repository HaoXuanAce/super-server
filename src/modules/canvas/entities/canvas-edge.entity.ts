import {
	Column,
	CreateDateColumn,
	DeleteDateColumn,
	Entity,
	Index,
	PrimaryColumn,
	UpdateDateColumn,
} from 'typeorm'

@Entity('canvas_edge')
@Index(['canvasId', 'deletedAt'])
@Index(['canvasId', 'sourceNodeId'])
@Index(['canvasId', 'targetNodeId'])
export class CanvasEdgeEntity {
	@PrimaryColumn({ type: 'varchar', length: 36 })
	canvasId!: string

	@PrimaryColumn({ type: 'varchar', length: 191 })
	edgeId!: string

	@Column({ type: 'varchar', length: 191 })
	sourceNodeId!: string

	@Column({ type: 'varchar', length: 191 })
	targetNodeId!: string

	@Column({ type: 'varchar', length: 191, nullable: true })
	sourceHandle!: string | null

	@Column({ type: 'varchar', length: 191, nullable: true })
	targetHandle!: string | null

	@Column({ type: 'varchar', length: 64, nullable: true })
	type!: string | null

	@Column({ type: 'json', nullable: true })
	data!: object | null

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
