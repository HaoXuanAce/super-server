import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm'

@Entity('canvas')
export class CanvasEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Column({ type: 'varchar', length: 36, nullable: true, unique: true })
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
