<script>
  import { milestones } from "$lib/stores/milestones";
  import { saveImage, convertToWebImage } from "$lib/stores/imageStore";
  import { isSupabaseConfigured } from "$lib/supabaseClient";
  import { uploadImage } from "$lib/stores/supabaseStore";
  import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS } from "$lib/types";

  let date = $state("");
  let title = $state("");
  let description = $state("");
  let category = $state("Event");
  let location = $state("");
  let imageUrl = $state("");
  let imageFile = $state(null);
  let imagePreviewSrc = $state("");
  let uploading = $state(false);
  let dragOver = $state(false);
  let submitted = $state(false);
  let uploadError = $state("");
  let useUrl = $state(false);

  const RAW_EXTENSIONS = [
    ".dng",
    ".heic",
    ".heif",
    ".raw",
    ".cr2",
    ".nef",
    ".arw",
  ];

  function isImageFile(file) {
    if (file.type.startsWith("image/")) return true;
    const ext = "." + file.name.split(".").pop().toLowerCase();
    return RAW_EXTENSIONS.includes(ext);
  }

  function handleFileSelect(file) {
    if (!file || !isImageFile(file)) return;
    imageFile = file;
    imageUrl = "";
    const reader = new FileReader();
    reader.onload = () => {
      imagePreviewSrc = reader.result;
    };
    reader.readAsDataURL(file);
  }

  function handleFileDrop(e) {
    e.preventDefault();
    dragOver = false;
    const file = e.dataTransfer?.files?.[0];
    handleFileSelect(file);
  }

  function handleFileInput(e) {
    const file = e.target.files?.[0];
    handleFileSelect(file);
  }

  function removeImage() {
    imageFile = null;
    imagePreviewSrc = "";
    imageUrl = "";
  }

  async function handleSubmit(e) {
    e.preventDefault();
    uploading = true;
    uploadError = "";

    let savedImageId = undefined;
    let savedImageUrl = undefined;

    try {
      if (imageFile) {
        // Convert to JPEG first (handles HEIC from Photos app, BMP, TIFF, etc.)
        const webFile = await convertToWebImage(imageFile);

        if (isSupabaseConfigured()) {
          // Upload to Supabase Storage → get public URL
          savedImageUrl = await uploadImage(webFile);
          if (!savedImageUrl) {
            uploadError =
              "Image upload failed — milestone saved without photo.";
          }
        } else {
          // Fallback: store in IndexedDB
          savedImageId = await saveImage(webFile);
        }
      } else if (imageUrl) {
        savedImageUrl = imageUrl;
      }

      await milestones.add({
        date,
        title,
        description,
        category,
        location: location || undefined,
        imageUrl: savedImageUrl,
        imageId: savedImageId,
      });

      submitted = true;
      date = "";
      title = "";
      description = "";
      category = "Event";
      location = "";
      imageUrl = "";
      imageFile = null;
      imagePreviewSrc = "";
      useUrl = false;
      setTimeout(() => {
        submitted = false;
        uploadError = "";
      }, 4000);
    } catch (err) {
      uploadError = "Something went wrong: " + (err.message || err);
    } finally {
      uploading = false;
    }
  }
</script>

<div class="page">
  <div class="header">
    <h1>✨ Add a Milestone</h1>
    <p>Record a meaningful moment in your journey together.</p>
  </div>

  {#if submitted}
    <div class="success-banner">
      🎉 Milestone added! <a href="/timeline">View on timeline →</a>
    </div>
  {/if}

  {#if uploadError}
    <div class="error-banner">
      ⚠️ {uploadError}
    </div>
  {/if}

  <form class="form" onsubmit={handleSubmit}>
    <div class="field">
      <label for="date">Date <span class="req">*</span></label>
      <input type="date" id="date" bind:value={date} required />
    </div>

    <div class="field">
      <label for="title">Title <span class="req">*</span></label>
      <input
        type="text"
        id="title"
        bind:value={title}
        placeholder="e.g., Our First Trip Together"
        required
        maxlength="100"
      />
    </div>

    <div class="field">
      <label for="category">Category <span class="req">*</span></label>
      <div class="category-selector">
        {#each CATEGORIES as cat}
          <button
            type="button"
            class="cat-option"
            class:selected={category === cat}
            style="--cat-color: {CATEGORY_COLORS[cat]}"
            onclick={() => (category = cat)}
          >
            <span class="cat-icon">{CATEGORY_ICONS[cat]}</span>
            <span>{cat}</span>
          </button>
        {/each}
      </div>
    </div>

    <div class="field">
      <label for="description">Description <span class="req">*</span></label>
      <textarea
        id="description"
        bind:value={description}
        placeholder="Tell the story of this moment..."
        required
        rows="4"
      ></textarea>
    </div>

    <div class="field-row">
      <div class="field">
        <label for="location">Location</label>
        <input
          type="text"
          id="location"
          bind:value={location}
          placeholder="e.g., Paris, France"
        />
      </div>
    </div>

    <div class="field">
      <label for="imageFileInput">Photo</label>
      {#if imagePreviewSrc || imageUrl}
        <div class="image-preview-wrapper">
          <div class="image-preview">
            <img
              src={imagePreviewSrc || imageUrl}
              alt="Preview"
              onerror={(e) => (e.target.style.display = "none")}
            />
          </div>
          <div class="image-info">
            {#if imageFile}
              <span class="file-name">📎 {imageFile.name}</span>
              <span class="file-size"
                >{(imageFile.size / 1024).toFixed(0)} KB</span
              >
            {:else}
              <span class="file-name">🔗 External URL</span>
            {/if}
            <button type="button" class="remove-image-btn" onclick={removeImage}
              >✕ Remove</button
            >
          </div>
        </div>
      {:else}
        <div
          class="upload-zone"
          class:drag-over={dragOver}
          role="button"
          tabindex="0"
          ondragover={(e) => {
            e.preventDefault();
            dragOver = true;
          }}
          ondragleave={() => (dragOver = false)}
          ondrop={handleFileDrop}
          onclick={() => document.getElementById("imageFileInput")?.click()}
          onkeydown={(e) => {
            if (e.key === "Enter" || e.key === " ")
              document.getElementById("imageFileInput")?.click();
          }}
        >
          <input
            type="file"
            id="imageFileInput"
            accept="image/*,.dng,.heic,.heif,.raw,.cr2,.nef,.arw"
            onchange={handleFileInput}
            hidden
          />
          <span class="upload-icon">📷</span>
          <span class="upload-text">Drop a photo here or click to browse</span>
          <span class="upload-hint"
            >Any format including HEIC & DNG — auto-converted to JPEG</span
          >
        </div>
        <button
          type="button"
          class="url-toggle"
          onclick={() => (useUrl = !useUrl)}
        >
          {useUrl ? "Hide URL field" : "Or paste an image URL instead"}
        </button>
        {#if useUrl}
          <input
            type="url"
            id="imageUrl"
            bind:value={imageUrl}
            placeholder="https://example.com/photo.jpg"
            oninput={() => {
              imagePreviewSrc = "";
              imageFile = null;
            }}
          />
        {/if}
      {/if}
    </div>

    <button type="submit" class="submit-btn" disabled={uploading}>
      {uploading ? "⏳ Saving..." : "💾 Save Milestone"}
    </button>
  </form>
</div>

<style>
  .page {
    max-width: 640px;
    margin: 0 auto;
  }

  .header {
    margin-bottom: 2rem;
  }

  .header h1 {
    font-size: 1.75rem;
    font-weight: 800;
  }

  .header p {
    color: var(--text-secondary);
    margin-top: 0.25rem;
  }

  .success-banner {
    padding: 1rem 1.25rem;
    background: #10b98120;
    border: 1px solid #10b981;
    border-radius: var(--radius-md);
    color: var(--success);
    font-weight: 500;
    margin-bottom: 1.5rem;
    animation: slideDown 0.3s ease;
  }

  .success-banner a {
    color: var(--success);
    text-decoration: underline;
    margin-left: 0.5rem;
  }

  .error-banner {
    padding: 1rem 1.25rem;
    background: #ef444420;
    border: 1px solid #ef4444;
    border-radius: var(--radius-md);
    color: #ef4444;
    font-weight: 500;
    margin-bottom: 1.5rem;
    animation: slideDown 0.3s ease;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  .form {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }

  .field {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
    flex: 1;
  }

  label {
    font-size: 0.85rem;
    font-weight: 600;
    color: var(--text-secondary);
  }

  .req {
    color: var(--danger);
  }

  input[type="text"],
  input[type="url"],
  input[type="date"],
  textarea {
    padding: 0.65rem 0.9rem;
    background: var(--bg-input);
    border: 1px solid var(--border-color);
    border-radius: var(--radius-md);
    font-size: 0.95rem;
    color: var(--text-primary);
    transition: border-color 0.2s;
    width: 100%;
  }

  input:focus,
  textarea:focus {
    outline: none;
    border-color: var(--border-focus);
    box-shadow: 0 0 0 3px var(--accent-light);
  }

  textarea {
    resize: vertical;
    min-height: 100px;
  }

  .field-row {
    display: flex;
    gap: 1rem;
  }

  .category-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 0.5rem;
  }

  .cat-option {
    display: flex;
    align-items: center;
    gap: 0.35rem;
    padding: 0.45rem 0.9rem;
    border: 2px solid var(--border-color);
    border-radius: var(--radius-full);
    background: var(--bg-card);
    color: var(--text-secondary);
    font-size: 0.85rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .cat-option:hover {
    border-color: var(--cat-color);
    color: var(--cat-color);
  }

  .cat-option.selected {
    border-color: var(--cat-color);
    background: var(--cat-color);
    color: white;
  }

  .cat-icon {
    font-size: 1rem;
  }

  .image-preview {
    border-radius: var(--radius-md);
    overflow: hidden;
    border: 1px solid var(--border-color);
    max-height: 200px;
  }

  .image-preview img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }

  .image-preview-wrapper {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .image-info {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    flex-wrap: wrap;
  }

  .file-name {
    font-size: 0.85rem;
    color: var(--text-secondary);
    font-weight: 500;
  }

  .file-size {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .remove-image-btn {
    margin-left: auto;
    padding: 0.3rem 0.7rem;
    border: 1px solid var(--danger);
    color: var(--danger);
    background: none;
    border-radius: var(--radius-full);
    font-size: 0.8rem;
    font-weight: 500;
    transition: all 0.2s;
  }

  .remove-image-btn:hover {
    background: var(--danger);
    color: white;
  }

  .upload-zone {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 2rem 1rem;
    border: 2px dashed var(--border-color);
    border-radius: var(--radius-lg);
    background: var(--bg-secondary);
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: center;
  }

  .upload-zone:hover,
  .upload-zone.drag-over {
    border-color: var(--accent);
    background: var(--accent-light);
  }

  .upload-icon {
    font-size: 2rem;
  }

  .upload-text {
    font-size: 0.95rem;
    font-weight: 600;
    color: var(--text-primary);
  }

  .upload-hint {
    font-size: 0.8rem;
    color: var(--text-muted);
  }

  .url-toggle {
    background: none;
    border: none;
    color: var(--text-muted);
    font-size: 0.8rem;
    text-decoration: underline;
    padding: 0.25rem 0;
    cursor: pointer;
    transition: color 0.2s;
  }

  .url-toggle:hover {
    color: var(--accent);
  }

  .submit-btn {
    padding: 0.85rem 1.5rem;
    background: var(--accent);
    color: white;
    border: none;
    border-radius: var(--radius-md);
    font-size: 1rem;
    font-weight: 600;
    transition: all 0.2s;
  }

  .submit-btn:hover {
    background: var(--accent-hover);
    transform: translateY(-1px);
    box-shadow: var(--shadow-md);
  }

  @media (max-width: 600px) {
    .field-row {
      flex-direction: column;
    }
  }
</style>
