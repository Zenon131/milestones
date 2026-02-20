export interface Milestone {
	id: string;
	date: string;
	title: string;
	description: string;
	category: MilestoneCategory;
	location?: string;
	imageUrl?: string;
	imageId?: string;
}

export type MilestoneCategory = 'Travel' | 'Event' | 'Personal' | 'Anniversary' | 'Achievement';

export const CATEGORIES: MilestoneCategory[] = [
	'Travel',
	'Event',
	'Personal',
	'Anniversary',
	'Achievement'
];

export const CATEGORY_COLORS: Record<MilestoneCategory, string> = {
	Travel: '#3b82f6',
	Event: '#f59e0b',
	Personal: '#ec4899',
	Anniversary: '#ef4444',
	Achievement: '#10b981'
};

export const CATEGORY_ICONS: Record<MilestoneCategory, string> = {
	Travel: '✈️',
	Event: '🎉',
	Personal: '💛',
	Anniversary: '💍',
	Achievement: '🏆'
};
