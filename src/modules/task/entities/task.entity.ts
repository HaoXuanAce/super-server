import {
	Column,
	CreateDateColumn,
	Entity,
	Index,
	PrimaryColumn,
	UpdateDateColumn,
} from 'typeorm'

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type TaskBillingStatus = 'pending' | 'charged' | 'refunded'

@Entity('tasks')
@Index(['userId', 'clientRequestId'], { unique: true })
export class TaskEntity {
	@PrimaryColumn({ type: 'varchar', length: 36 })
	id!: string

	@Column({ type: 'varchar', length: 32 })
	type!: string

	@Column({ type: 'varchar', length: 32 })
	status!: TaskStatus

	@Index()
	@Column({ type: 'varchar', length: 36, nullable: true })
	userId!: string | null

	@Column({ type: 'varchar', length: 32, nullable: true })
	provider!: string | null

	@Column({ type: 'varchar', length: 128, nullable: true })
	model!: string | null

	@Column({ type: 'json' })
	input!: object

	@Column({ type: 'decimal', precision: 15, scale: 2, default: 0 })
	chargeAmount!: string

	@Column({ type: 'varchar', length: 32, default: 'pending' })
	billingStatus!: TaskBillingStatus

	@Column({ type: 'json', nullable: true })
	pricingSnapshot!: object | null

	@Column({ type: 'varchar', length: 64, nullable: true })
	clientRequestId!: string | null

	@Column({ type: 'varchar', length: 255, nullable: true })
	providerTaskId!: string | null

	@Column({ type: 'json', nullable: true })
	result!: object | null

	@Column({ type: 'text', nullable: true })
	errorMessage!: string | null

	@Column({ type: 'datetime', nullable: true })
	refundedAt!: Date | null

	@CreateDateColumn()
	createdAt!: Date

	@UpdateDateColumn()
	updatedAt!: Date
}
