/**
 * Recipe Search and Multi-Criteria Filtering Utility for TastyBite
 */

/**
 * Searches and filters a list of recipes based on keywords, category, prep time, and dietary tags.
 * 
 * @param {Array<Object>} recipes - List of recipe objects.
 * @param {Object} options - Search and filtering options.
 * @param {string} [options.query=""] - Text search across title, description, and ingredients.
 * @param {string} [options.category="All"] - Category to filter by ("All" or specific name).
 * @param {number} [options.maxTime=0] - Maximum cooking/preparation time in minutes (0 = any).
 * @param {string} [options.sortBy="popular"] - Sort order: "popular", "quickest", "rating", or "alphabetical".
 * @returns {Array<Object>} Filtered and sorted recipes.
 */
export function searchRecipes(recipes = [], options = {}) {
  const {
    query = "",
    category = "All",
    maxTime = 0,
    sortBy = "popular"
  } = options;

  if (!Array.isArray(recipes)) return [];

  const cleanQuery = (query || "").trim().toLowerCase();

  const filtered = recipes.filter((recipe) => {
    // 1. Text Query Filter
    if (cleanQuery) {
      const titleMatch = recipe.title && recipe.title.toLowerCase().includes(cleanQuery);
      const descMatch = recipe.description && recipe.description.toLowerCase().includes(cleanQuery);
      
      let ingredientMatch = false;
      if (Array.isArray(recipe.ingredients)) {
        ingredientMatch = recipe.ingredients.some((ing) => {
          if (typeof ing === "string") return ing.toLowerCase().includes(cleanQuery);
          if (ing && typeof ing.name === "string") return ing.name.toLowerCase().includes(cleanQuery);
          return false;
        });
      }

      if (!titleMatch && !descMatch && !ingredientMatch) {
        return false;
      }
    }

    // 2. Category Filter
    if (category && category !== "All" && category.toLowerCase() !== "all") {
      const recipeCategory = (recipe.category || recipe.category_name || "").toLowerCase();
      if (recipeCategory !== category.toLowerCase()) {
        return false;
      }
    }

    // 3. Maximum Time Filter
    if (maxTime > 0) {
      const totalTime = (Number(recipe.prep_time) || 0) + (Number(recipe.cook_time) || 0);
      if (totalTime > maxTime) {
        return false;
      }
    }

    return true;
  });

  // Sort Results
  return filtered.sort((a, b) => {
    switch (sortBy) {
      case "quickest": {
        const timeA = (Number(a.prep_time) || 0) + (Number(a.cook_time) || 0);
        const timeB = (Number(b.prep_time) || 0) + (Number(b.cook_time) || 0);
        return timeA - timeB;
      }
      case "rating": {
        const ratingA = Number(a.rating) || 0;
        const ratingB = Number(b.rating) || 0;
        return ratingB - ratingA;
      }
      case "alphabetical": {
        return (a.title || "").localeCompare(b.title || "");
      }
      case "popular":
      default: {
        const reviewsA = Number(a.reviews_count || a.favorites_count) || 0;
        const reviewsB = Number(b.reviews_count || b.favorites_count) || 0;
        return reviewsB - reviewsA;
      }
    }
  });
}

/**
 * Extracts a unique list of categories available across a set of recipes.
 * @param {Array<Object>} recipes
 * @returns {Array<string>}
 */
export function extractCategories(recipes = []) {
  if (!Array.isArray(recipes)) return ["All"];
  const set = new Set();
  recipes.forEach((r) => {
    const cat = r.category || r.category_name;
    if (cat && typeof cat === "string") set.add(cat.trim());
  });
  return ["All", ...Array.from(set).sort()];
}
