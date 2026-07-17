export interface CreateUserInput {
	email?: string
	phone?: string
	passwordHash?: string
}

export interface UserProfile {
	id: string
	email: string | null
	phone: string | null
	balance: string
	createdAt: Date
}
