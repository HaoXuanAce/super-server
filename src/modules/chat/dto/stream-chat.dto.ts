import { Type } from 'class-transformer'
import {
	ArrayMaxSize,
	ArrayMinSize,
	IsArray,
	IsIn,
	IsString,
	Matches,
	MaxLength,
	MinLength,
	ValidateNested,
} from 'class-validator'

export class ChatMessageDto {
	@IsIn(['user', 'assistant'])
	role!: 'user' | 'assistant'

	@IsString()
	@MinLength(1)
	@MaxLength(8000)
	@Matches(/\S/, { message: '消息内容不能为空' })
	content!: string
}

export class StreamChatDto {
	@IsArray()
	@ArrayMinSize(1)
	@ArrayMaxSize(30)
	@ValidateNested({ each: true })
	@Type(() => ChatMessageDto)
	messages!: ChatMessageDto[]
}
