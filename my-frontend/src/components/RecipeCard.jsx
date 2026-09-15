// src/components/RecipeCard.jsx
import React from "react";
import { FaStar, FaRegStar, FaHeart, FaRegHeart } from "react-icons/fa";
import { getImageUrl, DEFAULT_FOOD_IMAGE } from "../utils/imageHelper";

export default function RecipeCard({
  recipe,
  isFavorite,
  toggleFavorite,
  isRated,
  toggleRate,
  onClickCard
}) {
  return (
    <div
      className="w-80 h-95 bg-amber-50 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-transform hover:scale-105 relative cursor-pointer flex flex-col"
      onClick={() => onClickCard && onClickCard(recipe.recipe_id)} // Open modal
    >
      {/* Recipe Image */}
      <div className="relative h-52 m-3 overflow-hidden rounded-2xl shadow-inner">
        <img
          src={getImageUrl(recipe.image_url)}
          alt={recipe.title}
          onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_FOOD_IMAGE; }}
          className="w-full h-full object-cover object-center transform hover:scale-105 transition-transform duration-300 rounded-2xl"
        />

        {/* Favorite & Rating Buttons */}
        <div
          className="absolute top-3 right-3 flex flex-col gap-2"
          onClick={(e) => e.stopPropagation()} // Prevent modal when clicking buttons
        >
          <button
            onClick={() => toggleRate(recipe.recipe_id)}
            className={`p-2 rounded-full text-lg shadow-md transition ${isRated ? "bg-yellow-400 text-white" : "bg-white text-yellow-400"
              } hover:scale-110`}
          >
            {isRated ? <FaStar /> : <FaRegStar />}
          </button>
          <button
            onClick={() => toggleFavorite(recipe.recipe_id)}
            className={`p-2 rounded-full text-lg shadow-md transition ${isFavorite ? "bg-red-500 text-white" : "bg-white text-red-500"
              } hover:scale-110`}
          >
            {isFavorite ? <FaHeart /> : <FaRegHeart />}
          </button>
        </div>
      </div>

      {/* Recipe Info */}
      <div className="p-4 flex flex-col flex-1">
        <div className="flex-1">
          <h3 className="text-lg font-bold text-gray-800 line-clamp-2">
            {recipe.title}
          </h3>
          <p className="text-gray-600 text-sm line-clamp-3">
            {recipe.description}
          </p>
        </div>

        {/* Bottom Info always at the bottom */}
        <div className="flex justify-between items-center mt-3">
          <span className="text-yellow-400 font-semibold text-lg">
            ★ {Number(recipe.avg_rating || 0).toFixed(1)}
          </span>
          <span className="text-gray-500 text-sm">
            Ratings: {recipe.total_ratings || 0}
          </span>
        </div>
      </div>

    </div>);
}
