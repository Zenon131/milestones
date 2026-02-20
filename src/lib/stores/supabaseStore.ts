import { supabase } from '$lib/supabaseClient';
import type { Milestone } from '$lib/types';

/**
 * Maps a Supabase row (snake_case) to our Milestone interface (camelCase).
 */
function rowToMilestone(row: any): Milestone {
	return {
		id: row.id,
		date: row.date,
		title: row.title,
		description: row.description,
		category: row.category,
		location: row.location || undefined,
		imageUrl: row.image_url || undefined,
		imageId: row.image_path || undefined
	};
}

/**
 * Maps a Milestone to a Supabase row for insert/update.
 */
function milestoneToRow(m: Omit<Milestone, 'id'> & { id?: string }) {
	return {
		...(m.id ? { id: m.id } : {}),
		date: m.date,
		title: m.title,
		description: m.description,
		category: m.category,
		location: m.location || null,
		image_url: m.imageUrl || null,
		image_path: m.imageId || null
	};
}

/** Fetch all milestones, sorted by date ascending. */
export async function fetchAllMilestones(): Promise<Milestone[]> {
	if (!supabase) return [];
	const { data, error } = await supabase
		.from('milestones')
		.select('*')
		.order('date', { ascending: true });

	if (error) {
		console.error('Failed to fetch milestones:', error.message);
		return [];
	}
	return (data || []).map(rowToMilestone);
}

/** Insert a new milestone. Returns the created milestone. */
export async function insertMilestone(milestone: Omit<Milestone, 'id'>): Promise<Milestone | null> {
	if (!supabase) return null;
	const { data, error } = await supabase
		.from('milestones')
		.insert(milestoneToRow(milestone))
		.select()
		.single();

	if (error) {
		console.error('Failed to insert milestone:', error.message);
		return null;
	}
	return rowToMilestone(data);
}

/** Update an existing milestone by ID. */
export async function updateMilestone(
	id: string,
	updates: Partial<Omit<Milestone, 'id'>>
): Promise<Milestone | null> {
	if (!supabase) return null;
	const row: Record<string, any> = {};
	if (updates.date !== undefined) row.date = updates.date;
	if (updates.title !== undefined) row.title = updates.title;
	if (updates.description !== undefined) row.description = updates.description;
	if (updates.category !== undefined) row.category = updates.category;
	if (updates.location !== undefined) row.location = updates.location || null;
	if (updates.imageUrl !== undefined) row.image_url = updates.imageUrl || null;
	if (updates.imageId !== undefined) row.image_path = updates.imageId || null;

	const { data, error } = await supabase
		.from('milestones')
		.update(row)
		.eq('id', id)
		.select()
		.single();

	if (error) {
		console.error('Failed to update milestone:', error.message);
		return null;
	}
	return rowToMilestone(data);
}

/** Delete a milestone by ID. Returns true on success. */
export async function deleteMilestone(id: string): Promise<boolean> {
	if (!supabase) return false;
	const { error } = await supabase.from('milestones').delete().eq('id', id);
	if (error) {
		console.error('Failed to delete milestone:', error.message);
		return false;
	}
	return true;
}

/** Upload an image to Supabase Storage. Returns the public URL. */
export async function uploadImage(file: File): Promise<string | null> {
	if (!supabase) return null;
	const ext = file.name.split('.').pop() || 'jpg';
	const path = `${crypto.randomUUID()}.${ext}`;

	console.log('[upload] file:', file.name, 'type:', file.type, 'size:', file.size, 'path:', path);

	const { data, error } = await supabase.storage
		.from('milestone-images')
		.upload(path, file, {
			contentType: file.type,
			upsert: false
		});

	if (error) {
		console.error('[upload] Failed:', error.message, error);
		return null;
	}

	console.log('[upload] Success, data:', data);

	const { data: urlData } = supabase.storage
		.from('milestone-images')
		.getPublicUrl(path);

	console.log('[upload] Public URL:', urlData.publicUrl);

	return urlData.publicUrl;
}

/** Delete an image from Supabase Storage by its path. */
export async function deleteStorageImage(imagePath: string): Promise<void> {
	if (!supabase) return;
	// Extract just the filename/path portion from a full URL if needed
	const path = imagePath.includes('/milestone-images/')
		? imagePath.split('/milestone-images/').pop()!
		: imagePath;

	const { error } = await supabase.storage
		.from('milestone-images')
		.remove([path]);

	if (error) {
		console.error('Failed to delete image:', error.message);
	}
}
