import type { UserProfile } from './user.interface'

export interface AuthResult {
	accessToken: string
	tokenType: 'Bearer'
	user: UserProfile
}
