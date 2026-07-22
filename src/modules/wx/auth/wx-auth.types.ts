import type { Request } from 'express'
import type { WxUserStatus } from '../common/wx-domain.types'

export interface WxJwtPayload {
	sub: number
	platform: 'wx'
}

export interface WxAuthenticatedUser {
	id: number
}

export interface WxAuthenticatedRequest extends Request {
	user: WxAuthenticatedUser
}

export interface WxUserProfile {
	id: number
	nickname: string | null
	avatarUrl: string | null
	status: WxUserStatus
	lastLoginAt: Date
	createdAt: Date
}

export interface WxAuthResult {
	accessToken: string
	tokenType: 'Bearer'
	user: WxUserProfile
}

export interface WxCode2SessionResponse {
	openid?: string
	session_key?: string
	unionid?: string
	errcode?: number
	errmsg?: string
}
