import { randomUUID } from 'node:crypto'

export function createWxShareToken(): string {
	return randomUUID().replaceAll('-', '')
}

export function createWxShareExpiry(expiresInDays: number): Date {
	const expiresAt = new Date()
	expiresAt.setDate(expiresAt.getDate() + expiresInDays)
	return expiresAt
}
