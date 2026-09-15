import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import axios from "axios";
import RecipeCard from "../components/RecipeCard";
import RecipeModal from "../components/RecipeModal";
import { FaSearch } from "react-icons/fa";
import { useAuth } from "../context/AuthContext";

export default function Recipes() {
  const { userId: user_id, isAuthenticated } = useAuth();
  const [categories, setCategories] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const categoryRefs = useRef({});
  const recipeRefs = useRef({});
  const location = useLocation();

  // === Fetch all data ===
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [catRes, recipeRes] = await Promise.all([
          axios.get("/api/categories"),
          axios.get("/api/all-recipes"),
        ]);

        setCategories(Array.isArray(catRes.data) ? catRes.data : []);
        setRecipes(Array.isArray(recipeRes.data) ? recipeRes.data : []);

        if (isAuthenticated) {
          try {
            const favRes = await axios.get("/api/favorites");
            const favData = Array.isArray(favRes.data) ? favRes.data : [];
            setFavorites(favData.map((r) => r.recipe_id));
          } catch (err) {
            console.error("Error loading favorites:", err);
            setFavorites([]);
          }
        } else {
          setFavorites([]);
        }
      } catch (err) {
        console.error("Error loading data:", err);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  // === Scroll when coming from Categories page ===
  // === Scroll or search when coming from Header ===
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const search = params.get("search");
    if (search && recipes.length > 0 && categories.length > 0) {
      console.log("🔎 Auto-search from URL:", search);
      const lowerTerm = search.toLowerCase().trim();

      // Find matching recipe or category
      const matchedRecipe = recipes.find((r) =>
        r.title.toLowerCase().includes(lowerTerm)
      );
      const matchedCategory = categories.find((c) =>
        c.category_name.toLowerCase().includes(lowerTerm)
      );

      if (matchedRecipe && recipeRefs.current[matchedRecipe.recipe_id]) {
        console.log("✅ Auto-scroll to recipe:", matchedRecipe.title);
        recipeRefs.current[matchedRecipe.recipe_id].scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else if (matchedCategory && categoryRefs.current[matchedCategory.category_id]) {
        console.log("✅ Auto-scroll to category:", matchedCategory.category_name);
        categoryRefs.current[matchedCategory.category_id].scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      } else {
        console.warn("⚠️ No match found for:", search);
      }
    }
  }, [categories, recipes, location.search]);


  // === Main Search Logic ===
  const handleSearch = () => {
    console.log("🔍 Searching for:", searchTerm);

    if (!searchTerm.trim()) {
      alert("Please enter a search term!");
      return;
    }

    const lowerTerm = searchTerm.toLowerCase().trim();

    // --- Match Recipe or Category ---
    const matchedRecipe = recipes.find((r) =>
      r.title.toLowerCase().includes(lowerTerm)
    );
    const matchedCategory = categories.find((c) =>
      c.category_name.toLowerCase().includes(lowerTerm)
    );

    // --- Debug Logs ---
    console.log("🧾 Recipes loaded:", recipes.length);
    console.log("🗂️ Categories loaded:", categories.length);
    console.log("⭐ Matched Recipe:", matchedRecipe ? matchedRecipe.title : "None");
    console.log("📂 Matched Category:", matchedCategory ? matchedCategory.category_name : "None");
    console.log("📍 Available category refs:", Object.keys(categoryRefs.current));
    console.log("📍 Available recipe refs:", Object.keys(recipeRefs.current));

    // --- Scroll to Recipe if found ---
    if (matchedRecipe && recipeRefs.current[matchedRecipe.recipe_id]) {
      console.log("✅ Scrolling to Recipe:", matchedRecipe.title);
      recipeRefs.current[matchedRecipe.recipe_id].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    // --- Scroll to Category if found ---
    if (matchedCategory && categoryRefs.current[matchedCategory.category_id]) {
      console.log("✅ Scrolling to Category:", matchedCategory.category_name);
      categoryRefs.current[matchedCategory.category_id].scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      return;
    }

    console.warn("⚠️ No matching category or recipe found in DOM");
    alert("No matching recipe or category found!");
  };

  // === Toggle Favorite ===
  const toggleFavorite = async (recipe_id) => {
    if (!isAuthenticated) return;
    try {
      if (favorites.includes(recipe_id)) {
        await axios.delete(`/api/favorites/${recipe_id}`);
        setFavorites((prev) => prev.filter((id) => id !== recipe_id));
      } else {
        await axios.post("/api/favorites", { recipe_id });
        setFavorites((prev) => [...prev, recipe_id]);
      }
    } catch (err) {
      console.error("Failed to update favorite", err);
    }
  };

  // Rating is now handled inside RecipeModal — no card-level handler needed
  // (left as no-op so RecipeCard prop is satisfied)
  const toggleRate = () => {};

  // Called by RecipeModal after a successful delete
  const handleRecipeDeleted = (deletedId) => {
    setRecipes((prev) => prev.filter((r) => r.recipe_id !== deletedId));
    setSelectedRecipeId(null);
  };

  // Called by RecipeModal after a successful edit (patch stats or null = full refetch)
  const handleRecipeUpdated = (updatedId, patch) => {
    if (patch) {
      // Patch avg/count in place after a rating change
      setRecipes((prev) =>
        prev.map((r) =>
          r.recipe_id === updatedId ? { ...r, ...patch } : r
        )
      );
    } else {
      // Full refetch after an edit (title, image etc. may have changed)
      fetch("/api/all-recipes")
        .then((r) => r.json())
        .then((data) => setRecipes(Array.isArray(data) ? data : []))
        .catch((err) => console.error("Refetch after edit:", err));
    }
  };

  // === Render ===
  return (
    <div
      className="min-h-screen relative bg-fixed bg-center bg-cover"
      style={{
        backgroundImage:
          'url("https://images.pexels.com/photos/616484/pexels-photo-616484.jpeg")',
      }}
    >
      <div className="bg-white/20 backdrop-blur-sm min-h-screen w-full pt-6 pb-12 px-6">
        {/* Title */}
        <h1 className="text-4xl md:text-4xl font-bold text-center text-yellow-700 mb-10 drop-shadow-md tracking-wide">
          🍽️ Explore All Recipes
        </h1>

        {/* Search Bar */}
        <div className="flex justify-center mb-5">
          <div className="flex gap-2 bg-white/90 backdrop-blur-sm shadow-lg rounded-full p-2 w-full max-w-md">
            <input
              type="text"
              placeholder="Search recipe or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="bg-transparent px-2 py-1 w-full focus:outline-none rounded-full"
            />
            <button
              onClick={handleSearch}
              className="bg-yellow-500 text-white px-3 py-2 rounded-full hover:bg-yellow-600 flex items-center justify-center"
            >
              <FaSearch />
            </button>
          </div>
        </div>

        {/* Categories and Recipes */}
        {categories.map((category) => {
          const catRecipes = recipes.filter(
            (r) => r.category_id === category.category_id
          );
          if (!catRecipes.length) return null;

          return (
            <div
              key={category.category_id}
              ref={(el) => (categoryRefs.current[category.category_id] = el)}
              className="mb-5 pt-2"
            >
              <h2 className="text-2xl md:text-3xl font-bold mb-6 text-yellow-700 drop-shadow-md bg-gradient-to-r from-yellow-100/30 via-yellow-200/20 to-yellow-100/30 inline-block px-4 py-1 rounded">
                {category.category_name}
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
                {catRecipes.map((recipe) => (
                  <div
                    key={recipe.recipe_id}
                    ref={(el) => (recipeRefs.current[recipe.recipe_id] = el)}
                    className="opacity-95 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                    onClick={() => setSelectedRecipeId(recipe.recipe_id)}
                  >
                    <RecipeCard
                      recipe={recipe}
                      isFavorite={favorites.includes(recipe.recipe_id)}
                      toggleFavorite={toggleFavorite}
                      isRated={false}
                      toggleRate={toggleRate}
                    />
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {selectedRecipeId && (
        <RecipeModal
          recipeId={selectedRecipeId}
          userId={user_id}
          onClose={() => setSelectedRecipeId(null)}
          onRecipeDeleted={handleRecipeDeleted}
          onRecipeUpdated={handleRecipeUpdated}
        />
      )}
    </div>
  );
}
