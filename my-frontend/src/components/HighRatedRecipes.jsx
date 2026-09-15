import React, { useState, useEffect } from "react";
import axios from "axios";
import RecipeCard from "../components/RecipeCard";
import RecipeModal from "../components/RecipeModal";
import { useAuth } from "../context/AuthContext";

export default function HighRatedRecipes() {
  const { userId: USER_ID, isAuthenticated } = useAuth();
  const [recipes, setRecipes] = useState([]);
  const [favorites, setFavorites] = useState([]);
  const [selectedRecipeId, setSelectedRecipeId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const recipesRes = await axios.get("/api/high-rated-recipes");
        setRecipes(Array.isArray(recipesRes.data) ? recipesRes.data : []);

        if (isAuthenticated) {
          try {
            const favRes = await axios.get("/api/favorites");
            const favData = Array.isArray(favRes.data) ? favRes.data : [];
            setFavorites(favData.map((r) => r.recipe_id));
          } catch (err) {
            console.error(err);
            setFavorites([]);
          }
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load recipes.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [isAuthenticated]);

  const toggleFavorite = async (recipe_id) => {
    if (!isAuthenticated) return;
    const isFav = favorites.includes(recipe_id);
    try {
      if (isFav) {
        await axios.delete(`/api/favorites/${recipe_id}`);
        setFavorites(favorites.filter((id) => id !== recipe_id));
      } else {
        await axios.post("/api/favorites", { recipe_id });
        setFavorites([...favorites, recipe_id]);
      }
    } catch (err) {
      console.error("Failed to update favorite", err);
      alert("Failed to update favorite");
    }
  };

  const toggleRate = () => {};

  const handleRecipeDeleted = (deletedId) => {
    setRecipes((prev) => prev.filter((r) => r.recipe_id !== deletedId));
    setSelectedRecipeId(null);
  };

  const handleRecipeUpdated = (updatedId, patch) => {
    if (patch) {
      setRecipes((prev) =>
        prev.map((r) => r.recipe_id === updatedId ? { ...r, ...patch } : r)
      );
    } else {
      axios.get("/api/high-rated-recipes")
        .then((res) => setRecipes(Array.isArray(res.data) ? res.data : []))
        .catch((err) => console.error("Refetch after edit:", err));
    }
  };

  if (loading) return <p className="text-center mt-10">Loading recipes...</p>;
  if (error) return <p className="text-center mt-10 text-red-600">{error}</p>;

  return (
    <>
      <div className="mt-10 px-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {recipes.map((recipe) => (
          <RecipeCard
            key={recipe.recipe_id}
            recipe={recipe}
            isFavorite={favorites.includes(recipe.recipe_id)}
            toggleFavorite={toggleFavorite}
            isRated={false}
            toggleRate={toggleRate}
            onClickCard={(id) => setSelectedRecipeId(id)} // NEW
          />
        ))}
      </div>

      {selectedRecipeId && (
        <RecipeModal
          recipeId={selectedRecipeId}
          onClose={() => setSelectedRecipeId(null)}
          userId={USER_ID}
          onRecipeDeleted={handleRecipeDeleted}
          onRecipeUpdated={handleRecipeUpdated}
        />
      )}
    </>
  );
}
