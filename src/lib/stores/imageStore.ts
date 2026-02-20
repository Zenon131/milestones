const DB_NAME = 'milestone-images';
const DB_VERSION = 1;
const STORE_NAME = 'images';

function openDB(): Promise<IDBDatabase> {
	return new Promise((resolve, reject) => {
		const request = indexedDB.open(DB_NAME, DB_VERSION);
		request.onupgradeneeded = () => {
			const db = request.result;
			if (!db.objectStoreNames.contains(STORE_NAME)) {
				db.createObjectStore(STORE_NAME, { keyPath: 'id' });
			}
		};
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

export interface StoredImage {
	id: string;
	data: string; // base64 data URL
	name: string;
	type: string;
	size: number;
}

/** Save an image blob to IndexedDB. Returns the generated ID. */
export async function saveImage(file: File): Promise<string> {
	const id = crypto.randomUUID();
	const data = await fileToDataURL(file);
	const record: StoredImage = {
		id,
		data,
		name: file.name,
		type: file.type,
		size: file.size
	};
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		tx.objectStore(STORE_NAME).put(record);
		tx.oncomplete = () => resolve(id);
		tx.onerror = () => reject(tx.error);
	});
}

/** Save a pre-built image record (used during import). */
export async function saveImageRecord(record: StoredImage): Promise<void> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		tx.objectStore(STORE_NAME).put(record);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

/** Retrieve an image by ID. */
export async function getImage(id: string): Promise<StoredImage | null> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readonly');
		const request = tx.objectStore(STORE_NAME).get(id);
		request.onsuccess = () => resolve(request.result || null);
		request.onerror = () => reject(request.error);
	});
}

/** Delete an image by ID. */
export async function deleteImage(id: string): Promise<void> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		tx.objectStore(STORE_NAME).delete(id);
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

/** Get all stored images (for export). */
export async function getAllImages(): Promise<StoredImage[]> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readonly');
		const request = tx.objectStore(STORE_NAME).getAll();
		request.onsuccess = () => resolve(request.result);
		request.onerror = () => reject(request.error);
	});
}

/** Clear all images from the store. */
export async function clearImages(): Promise<void> {
	const db = await openDB();
	return new Promise((resolve, reject) => {
		const tx = db.transaction(STORE_NAME, 'readwrite');
		tx.objectStore(STORE_NAME).clear();
		tx.oncomplete = () => resolve();
		tx.onerror = () => reject(tx.error);
	});
}

/**
 * Convert any image File (including HEIC from Photos app) to a web-friendly
 * JPEG File, resized to maxDimension. Always outputs image/jpeg regardless of input format.
 */
export function convertToWebImage(file: File, maxDimension = 1600): Promise<File> {
	return new Promise((resolve, reject) => {
		const url = URL.createObjectURL(file);
		const img = new Image();
		img.onload = () => {
			URL.revokeObjectURL(url);
			let { width, height } = img;
			if (width > maxDimension || height > maxDimension) {
				const ratio = Math.min(maxDimension / width, maxDimension / height);
				width = Math.round(width * ratio);
				height = Math.round(height * ratio);
			}
			const canvas = document.createElement('canvas');
			canvas.width = width;
			canvas.height = height;
			const ctx = canvas.getContext('2d')!;
			ctx.drawImage(img, 0, 0, width, height);
			canvas.toBlob(
				(blob) => {
					if (blob) {
						const name = file.name.replace(/\.[^.]+$/, '.jpeg');
						resolve(new File([blob], name, { type: 'image/jpeg' }));
					} else {
						reject(new Error('Failed to convert image'));
					}
				},
				'image/jpeg',
				0.85
			);
		};
		img.onerror = () => {
			URL.revokeObjectURL(url);
			reject(new Error('Unable to load image — format may not be supported by this browser'));
		};
		img.src = url;
	});
}

/** Convert a File to a base64 data URL, with optional resizing for large images. */
function fileToDataURL(file: File, maxDimension = 1600): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => {
			const img = new Image();
			img.onload = () => {
				// Always draw through canvas to normalise format to JPEG
				const canvas = document.createElement('canvas');
				let { width, height } = img;
				if (width > maxDimension || height > maxDimension) {
					const ratio = Math.min(maxDimension / width, maxDimension / height);
					width = Math.round(width * ratio);
					height = Math.round(height * ratio);
				}
				canvas.width = width;
				canvas.height = height;
				const ctx = canvas.getContext('2d')!;
				ctx.drawImage(img, 0, 0, width, height);
				resolve(canvas.toDataURL('image/jpeg', 0.85));
			};
			img.onerror = () => resolve(reader.result as string); // fallback
			img.src = reader.result as string;
		};
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
	});
}
