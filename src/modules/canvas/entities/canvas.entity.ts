import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm'

@Entity('canvas')
export class CanvasEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Index()
	@Column({ type: 'varchar', length: 36, nullable: true })
	ownerUserId!: string | null

	@Column({ type: 'varchar', length: 191 })
	name!: string

	@Column({ type: 'bigint', unsigned: true, default: 0 })
	currentVersion!: string

	@CreateDateColumn()
	createdAt!: Date

	@UpdateDateColumn()
	updatedAt!: Date
}
