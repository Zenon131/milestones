import { writable, derived } from 'svelte/store';
import type { Milestone, MilestoneCategory } from '$lib/types';
import { deleteImage, getAllImages, saveImageRecord, clearImages } from '$lib/stores/imageStore';
import { isSupabaseConfigured } from '$lib/supabaseClient';
import {
	fetchAllMilestones,
	insertMilestone,
	updateMilestone as updateMilestoneDB,
	deleteMilestone as deleteMilestoneDB,
	uploadImage,
	deleteStorageImage
} from '$lib/stores/supabaseStore';

const STORAGE_KEY = 'relationship-milestones';

// ── localStorage helpers (offline fallback) ──────────────────────────
function loadFromStorage(): Milestone[] {
	if (typeof window === 'undefined') return [];
	try {
		const data = localStorage.getItem(STORAGE_KEY);
		return data ? JSON.parse(data) : [];
	} catch {
		return [];
	}
}

function saveToStorage(milestones: Milestone[]) {
	if (typeof window === 'undefined') return;
	localStorage.setItem(STORAGE_KEY, JSON.stringify(milestones));
}

// ── Store ────────────────────────────────────────────────────────────
function createMilestoneStore() {
	const { subscribe, set, update } = writable<Milestone[]>([]);
	let initialized = false;
	const online = () => isSupabaseConfigured();

	return {
		subscribe,

		async init() {
			if (initialized) return;
			initialized = true;

			if (online()) {
				try {
					const data = await fetchAllMilestones();
					set(data);
					saveToStorage(data); // cache locally
				} catch {
					set(loadFromStorage());
				}
			} else {
				set(loadFromStorage());
			}
		},

		async add(milestone: Omit<Milestone, 'id'>) {
			if (online()) {
				// If there's a local imageId (IndexedDB), upload to Supabase Storage first
				let finalMilestone = { ...milestone };

				const inserted = await insertMilestone(finalMilestone);
				if (inserted) {
					update((milestones) => {
						const updated = [...milestones, inserted].sort(
							(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
						);
						saveToStorage(updated);
						return updated;
					});
					return;
				}
			}

			// Offline fallback
			update((milestones) => {
				const newMilestone: Milestone = {
					...milestone,
					id: crypto.randomUUID()
				};
				const updated = [...milestones, newMilestone].sort(
					(a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
				);
				saveToStorage(updated);
				return updated;
			});
		},

		async remove(id: string) {
			let toRemove: Milestone | undefined;
			update((milestones) => {
				toRemove = milestones.find((m) => m.id === id);
				return milestones;
			});

			if (online()) {
				const success = await deleteMilestoneDB(id);
				if (success) {
					// Clean up associated image from storage
					if (toRemove?.imageUrl && toRemove.imageUrl.includes('milestone-images')) {
						deleteStorageImage(toRemove.imageUrl).catch(() => {});
					}
				}
			}

			// Also clean up local IndexedDB image if present
			if (toRemove?.imageId) {
				deleteImage(toRemove.imageId).catch(() => {});
			}

			update((milestones) => {
				const updated = milestones.filter((m) => m.id !== id);
				saveToStorage(updated);
				return updated;
			});
		},

		async update(id: string, data: Partial<Omit<Milestone, 'id'>>) {
			if (online()) {
				await updateMilestoneDB(id, data);
			}
			update((milestones) => {
				const updated = milestones
					.map((m) => (m.id === id ? { ...m, ...data } : m))
					.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
				saveToStorage(updated);
				return updated;
			});
		},

		/** Upload a file to Supabase Storage. Returns the public URL or null. */
		async uploadImage(file: File): Promise<string | null> {
			if (online()) {
				return uploadImage(file);
			}
			return null;
		},

		exportJSON(): string {
			let current: Milestone[] = [];
			subscribe((v) => (current = v))();
			return JSON.stringify(current, null, 2);
		},

		async exportWithImages(): Promise<string> {
			let current: Milestone[] = [];
			subscribe((v) => (current = v))();
			const images = await getAllImages();
			const imageMap: Record<string, { data: string; name: string; type: string }> = {};
			for (const img of images) {
				imageMap[img.id] = { data: img.data, name: img.name, type: img.type };
			}
			return JSON.stringify({ milestones: current, images: imageMap }, null, 2);
		},

		async importJSON(json: string) {
			try {
				const parsed = JSON.parse(json);
				const data: Milestone[] = Array.isArray(parsed) ? parsed : parsed.milestones;
				const images = Array.isArray(parsed) ? null : parsed.images;
				if (!Array.isArray(data)) throw new Error('Invalid format');

				const validated = data.map((m: any) => ({
					id: m.id || crypto.randomUUID(),
					date: m.date,
					title: m.title,
					description: m.description,
					category: m.category,
					location: m.location || '',
					imageUrl: m.imageUrl || '',
					imageId: m.imageId || ''
				}));

				if (images && typeof images === 'object') {
					for (const [id, img] of Object.entries(images) as [string, any][]) {
						await saveImageRecord({
							id,
							data: img.data,
							name: img.name,
							type: img.type,
							size: img.data?.length || 0
						});
					}
				}

				// If Supabase is online, push each milestone to the DB
				if (online()) {
					for (const m of validated) {
						await insertMilestone(m);
					}
					// Re-fetch from DB to get server-generated IDs
					const fresh = await fetchAllMilestones();
					set(fresh);
					saveToStorage(fresh);
					return { success: true, count: fresh.length };
				}

				const sorted = validated.sort(
					(a: Milestone, b: Milestone) =>
						new Date(a.date).getTime() - new Date(b.date).getTime()
				);
				set(sorted);
				saveToStorage(sorted);
				return { success: true, count: sorted.length };
			} catch (e) {
				return { success: false, count: 0, error: String(e) };
			}
		},

		clear() {
			set([]);
			saveToStorage([]);
			clearImages().catch(() => {});
		}
	};
}

export const milestones = createMilestoneStore();

export const selectedMilestone = writable<Milestone | null>(null);

export const activeFilters = writable<MilestoneCategory[]>([]);

export const filteredMilestones = derived(
	[milestones, activeFilters],
	([$milestones, $activeFilters]) => {
		if ($activeFilters.length === 0) return $milestones;
		return $milestones.filter((m) => $activeFilters.includes(m.category));
	}
);

// Theme store
function createThemeStore() {
	const { subscribe, set } = writable<'light' | 'dark'>('light');

	return {
		subscribe,
		init() {
			if (typeof window === 'undefined') return;
			const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
			const preferred = window.matchMedia('(prefers-color-scheme: dark)').matches
				? 'dark'
				: 'light';
			const theme = saved || preferred;
			set(theme);
			document.documentElement.setAttribute('data-theme', theme);
		},
		toggle() {
			let current: 'light' | 'dark' = 'light';
			subscribe((v) => (current = v))();
			const next = current === 'light' ? 'dark' : 'light';
			set(next);
			localStorage.setItem('theme', next);
			document.documentElement.setAttribute('data-theme', next);
		}
	};
}

export const theme = createThemeStore();
