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
 * Web-safe mime types that Supabase Storage accepts and browsers can display.
 * Files with these types can be uploaded directly without conversion.
 */
const WEB_SAFE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

/**
 * Convert an image File to a web-friendly format for upload.
 * - Web-safe formats (JPEG, PNG, WebP, GIF) are returned as-is (no conversion).
 * - Non-web formats (HEIC on Safari, etc.) are converted to JPEG via canvas.
 * - Times out after 15 seconds to prevent hanging on unsupported formats.
 */
export async function convertToWebImage(file: File, maxDimension = 1600): Promise<File> {
	// If already web-safe, return directly — no canvas needed
	if (WEB_SAFE_TYPES.includes(file.type)) {
		return file;
	}

	// Reject very large raw files (over 100MB)
	if (file.size > 100 * 1024 * 1024) {
		throw new Error('File is too large (>100MB). Please export as JPEG or PNG first.');
	}

	// For non-web formats, read as data URL then draw through canvas (with timeout)
	const dataUrl = await readFileAsDataURL(file);
	return new Promise((resolve, reject) => {
		const timeout = setTimeout(() => {
			reject(new Error('Image conversion timed out — this format may not be supported. Please export as JPEG or PNG.'));
		}, 15000);

		const img = new Image();
		img.onload = () => {
			clearTimeout(timeout);
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
			clearTimeout(timeout);
			reject(new Error('Unable to load image — please export as JPEG or PNG first.'));
		};
		img.src = dataUrl;
	});
}

/** Read a File into a data URL string. */
function readFileAsDataURL(file: File): Promise<string> {
	return new Promise((resolve, reject) => {
		const reader = new FileReader();
		reader.onload = () => resolve(reader.result as string);
		reader.onerror = () => reject(reader.error);
		reader.readAsDataURL(file);
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
