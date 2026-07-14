import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryGeneratedColumn,
	UpdateDateColumn,
} from 'typeorm'

@Entity('users')
export class UserEntity {
	@PrimaryGeneratedColumn('uuid')
	id!: string

	@Column({ type: 'varchar', length: 191, nullable: true, unique: true })
	email!: string | null

	@Column({ type: 'varchar', length: 32, nullable: true, unique: true })
	phone!: string | null

	@Column({ type: 'varchar', length: 255, nullable: true, select: false })
	passwordHash!: string | null

	@Column({ type: 'varchar', length: 128, nullable: true, unique: true })
	wechatOpenId!: string | null

	@Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
	balance!: string

	@CreateDateColumn()
	createdAt!: Date

	@UpdateDateColumn()
	updatedAt!: Date
}
