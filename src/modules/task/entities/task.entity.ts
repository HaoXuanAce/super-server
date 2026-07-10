import {
	Column,
	CreateDateColumn,
	Entity,
	PrimaryColumn,
	UpdateDateColumn,
} from 'typeorm'

export type TaskStatus = 'pending' | 'processing' | 'completed' | 'failed'

@Entity('tasks')
export class TaskEntity {
	@PrimaryColumn({ type: 'varchar', length: 36 })
	id!: string

	@Column({ type: 'varchar', length: 32 })
	type!: string

	@Column({ type: 'varchar', length: 32 })
	status!: TaskStatus

	@Column({ type: 'json' })
	input!: object

	@Column({ type: 'varchar', length: 255, nullable: true })
	providerTaskId!: string | null

	@Column({ type: 'json', nullable: true })
	result!: object | null

	@Column({ type: 'text', nullable: true })
	errorMessage!: string | null

	@CreateDateColumn()
	createdAt!: Date

	@UpdateDateColumn()
	updatedAt!: Date
}
