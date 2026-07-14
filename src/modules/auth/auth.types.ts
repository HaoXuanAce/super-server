import type { Request } from 'express'

export interface JwtPayload {
	id: string
	email: string | null
}

export interface AuthenticatedRequest extends Request {
	user: JwtPayload
}
