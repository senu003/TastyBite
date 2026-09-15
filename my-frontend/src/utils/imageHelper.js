export const DEFAULT_FOOD_IMAGE =
  "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=500&auto=format&fit=crop&q=80";

/**
 * Returns a valid, safe image URL for recipe or category images.
 * Handles absolute URLs (Supabase / HTTPS / HTTP / data URIs), relative server paths, and fallbacks.
 * @param {string} url 
 * @returns {string}
 */
export function getImageUrl(url) {
  if (!url || typeof url !== "string" || !url.trim()) {
    return DEFAULT_FOOD_IMAGE;
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
