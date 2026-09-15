import React, { useEffect, useState } from "react";
import axios from "axios";

import RecipeCard from "../components/RecipeCard";
import RecipeModal from "../components/RecipeModal";
import { useAuth } from "../context/AuthContext";

export default function Favorites() {
  const { userId: USER_ID, isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState([]);
  const [recipes, setRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null); // ✅ Modal control

  useEffect(() => {
    if (!isAuthenticated) {
      setLoading(false);
      return;
    }
    const fetchFavorites = async () => {
      try {
        setLoading(true);
        const res = await axios.get("/api/favorites");
        const data = Array.isArray(res.data) ? res.data : [];
        setRecipes(data);
        setFavorites(data.map((r) => r.recipe_id));
      } catch (err) {
        console.error("Error fetching favorites:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchFavorites();
  }, [isAuthenticated]);

  const removeFavorite = async (recipe_id) => {
    try {
      await axios.delete(`/api/favorites/${recipe_id}`);
      setFavorites((prev) => prev.filter((id) => id !== recipe_id));
      setRecipes((prev) => prev.filter((r) => r.recipe_id !== recipe_id));
    } catch (err) {
      console.error("Failed to remove favorite", err);
      alert("Failed to remove favorite");
    }
  };

  const toggleRate = () => {};

  const handleRecipeDeleted = (deletedId) => {
    setRecipes((prev) => prev.filter((r) => r.recipe_id !== deletedId));
    setFavorites((prev) => prev.filter((id) => id !== deletedId));
    setSelectedRecipeId(null);
  };

  const handleRecipeUpdated = (updatedId, patch) => {
    if (patch) {
      setRecipes((prev) =>
        prev.map((r) => r.recipe_id === updatedId ? { ...r, ...patch } : r)
      );
    } else {
      axios.get("/api/favorites")
        .then((res) => setRecipes(Array.isArray(res.data) ? res.data : []))
        .catch((err) => console.error("Refetch after edit:", err));
    }
  };

  if (loading)
    return (
      <p className="text-center mt-10 text-white text-lg">
        Loading favorites...
      </p>
    );

  if (!isAuthenticated)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl">
          <p className="text-yellow-800 text-lg font-semibold mb-2">Please log in to view your favorites</p>
          <p className="text-gray-500 text-sm">Your saved recipes will appear here after you log in.</p>
        </div>
      </div>
    );

  if (recipes.length === 0)
    return (
      <p className="text-center mt-10 text-white text-lg">
        No favorites yet!
      </p>
    );

  return (
    <div
      className="min-h-screen relative bg-fixed bg-center bg-cover"
      style={{
        backgroundImage:
          'url("https://images.pexels.com/photos/616484/pexels-photo-616484.jpeg")',
      }}
    >
      

      {/* Overlay + blur */}
      <div className="bg-white/20 backdrop-blur-sm min-h-screen w-full pt-6 pb-12 px-6">
        <h1 className="text-4xl font-bold text-center text-yellow-700 mb-10 drop-shadow-md tracking-wide">
          ❤️ Favorite Recipes
        </h1>

        {/* Grid of Recipe Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
          {recipes.map((recipe) => (
            <div
              key={recipe.recipe_id}
              className="opacity-95 hover:opacity-100 transition-opacity duration-300 cursor-pointer"
              onClick={() => setSelectedRecipeId(recipe.recipe_id)} // ✅ Open modal
            >
              <RecipeCard
                recipe={recipe}
                isFavorite={favorites.includes(recipe.recipe_id)}
                toggleFavorite={removeFavorite}
                isRated={false}
                toggleRate={toggleRate}
              />
            </div>
          ))}
        </div>
      </div>

      {/* ✅ Recipe Modal */}
      {selectedRecipeId && (
        <RecipeModal
          recipeId={selectedRecipeId}
          userId={USER_ID}
          onClose={() => setSelectedRecipeId(null)}
          onRecipeDeleted={handleRecipeDeleted}
          onRecipeUpdated={handleRecipeUpdated}
        />
      )}
    </div>
  );
}
