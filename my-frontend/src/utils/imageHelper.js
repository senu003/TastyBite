export const DEFAULT_FOOD_IMAGE =
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500&auto=format&fit=crop&q=80";

/**
 * Category-specific high-resolution fallback images
 */
export const CATEGORY_FALLBACK_IMAGES = {
  italian: "https://images.unsplash.com/photo-1551183053-bf91a1d81141?w=500&auto=format&fit=crop&q=80",
  pasta: "https://images.unsplash.com/photo-1621996346565-e3d5d6281781?w=500&auto=format&fit=crop&q=80",
  dessert: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=500&auto=format&fit=crop&q=80",
  baking: "https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=80",
  salad: "https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=500&auto=format&fit=crop&q=80",
  beverage: "https://images.unsplash.com/photo-1544145945-f90425340c7e?w=500&auto=format&fit=crop&q=80",
  soup: "https://images.unsplash.com/photo-1547592166-23ac45744acd?w=500&auto=format&fit=crop&q=80",
  default: DEFAULT_FOOD_IMAGE
};

/**
 * Returns a valid, safe image URL for recipe or category images.
 * Handles absolute URLs (Supabase / HTTPS / HTTP / data URIs), relative server paths, and fallbacks.
 * @param {string} url 
 * @param {string} [category=""]
 * @returns {string}
 */
export function getImageUrl(url, category = "") {
  if (!url || typeof url !== "string" || !url.trim()) {
    return getImageFallback(category);
  }

  const trimmed = url.trim();

  // If already full absolute URL or data URI
  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  const apiUrl = import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL.replace(/\/+$/, "") : "";
  return apiUrl ? `${apiUrl}${path}` : path;
}

/**
 * Returns a tailored fallback image based on recipe category.
 * @param {string} category 
 * @returns {string}
 */
export function getImageFallback(category = "") {
  if (!category) return DEFAULT_FOOD_IMAGE;
  const key = category.trim().toLowerCase();
  for (const [catName, fallbackUrl] of Object.entries(CATEGORY_FALLBACK_IMAGES)) {
    if (key.includes(catName)) {
      return fallbackUrl;
    }
  }
  return DEFAULT_FOOD_IMAGE;
}

/**
 * Validates a recipe image file before upload.
 * Enforces allowed image MIME types and maximum file size.
 * 
 * @param {File} file 
 * @param {number} [maxSizeMB=5] 
 * @returns {{ isValid: boolean, error: string | null }}
 */
export function validateRecipeImage(file, maxSizeMB = 5) {
  if (!file) {
    return { isValid: false, error: "Please select an image file to upload." };
  }

  const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];
  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: "Unsupported image format. Allowed formats: JPEG, PNG, WebP, or GIF."
    };
  }

  const maxBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxBytes) {
    return {
      isValid: false,
      error: `Image file is too large (${formatFileSize(file.size)}). Maximum allowed size is ${maxSizeMB}MB.`
    };
  }

  return { isValid: true, error: null };
}

/**
 * Formats byte size into human readable string.
 * @param {number} bytes 
 * @returns {string}
 */
export function formatFileSize(bytes) {
  if (!bytes || bytes <= 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}
