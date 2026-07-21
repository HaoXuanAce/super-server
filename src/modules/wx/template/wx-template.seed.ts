import { Injectable, type OnApplicationBootstrap } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { WxTemplateEntity } from '../entities/wx-template.entity'

const SYSTEM_TEMPLATES = [
	{
		id: '00000000-0000-4000-8000-000000000001',
		name: '空白问卷',
		description: '从空白问卷开始创建',
		content: { questions: [], settings: {} },
	},
	{
		id: '00000000-0000-4000-8000-000000000002',
		name: '第一次约会指南',
		description: '从口味到约会方式，轻松发现彼此的小偏好。',
		content: {
			questions: [
				{
					id: 'first-date-1',
					type: 'single',
					title: '你更喜欢哪种约会氛围？',
					required: true,
					options: ['安静散步', '热闹市集', '一起看展', '随缘就好'],
				},
				{
					id: 'first-date-2',
					type: 'multiple',
					title: '哪些食物会让你立刻开心？',
					required: false,
					options: ['火锅', '甜品', '烧烤', '家常菜'],
				},
				{
					id: 'first-date-3',
					type: 'text',
					title: '最近最想和喜欢的人一起做什么？',
					required: true,
					options: [],
				},
			],
			settings: {},
		},
	},
	{
		id: '00000000-0000-4000-8000-000000000003',
		name: '我们的爱的语言',
		description: '了解对方感受到爱与被重视的方式。',
		content: {
			questions: [
				{
					id: 'love-language-1',
					type: 'single',
					title: '哪件事最能让你感受到被爱？',
					required: true,
					options: ['认真陪伴', '暖心礼物', '一句肯定', '主动帮忙'],
				},
				{
					id: 'love-language-2',
					type: 'text',
					title: '分享一个曾让你心动的小瞬间。',
					required: false,
					options: [],
				},
			],
			settings: {},
		},
	},
	{
		id: '00000000-0000-4000-8000-000000000004',
		name: '周末合拍测试',
		description: '宅家还是出发？看看你们的周末默契。',
		content: {
			questions: [
				{
					id: 'weekend-1',
					type: 'single',
					title: '理想周末从几点开始？',
					required: true,
					options: ['早起出门', '睡到自然醒', '午后再安排', '没有计划'],
				},
				{
					id: 'weekend-2',
					type: 'multiple',
					title: '想一起解锁哪些活动？',
					required: true,
					options: ['短途旅行', '做饭', '逛书店', '运动'],
				},
			],
			settings: {},
		},
	},
]

@Injectable()
export class WxTemplateSeedService implements OnApplicationBootstrap {
	constructor(
		@InjectRepository(WxTemplateEntity)
		private readonly templateRepository: Repository<WxTemplateEntity>,
	) {}

	async onApplicationBootstrap(): Promise<void> {
		await this.templateRepository
			.createQueryBuilder()
			.insert()
			.into(WxTemplateEntity)
			.values(SYSTEM_TEMPLATES.map((template) => ({
				...template,
				ownerUserId: null,
				coverUrl: null,
				isSystem: true,
				isPublic: true,
			})))
			.orIgnore()
			.execute()
	}
}
