// src/pages/CategoriesPage.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { getImageUrl, DEFAULT_FOOD_IMAGE } from "../utils/imageHelper";

export default function CategoriesPage() {
  const [categories, setCategories] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("/api/categories")
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  const handleCategoryClick = (categoryName) => {
    // Pass category name in query string
    navigate(`/recipes?search=${encodeURIComponent(categoryName)}`);
  };

  return (
    <div
      className="min-h-screen bg-gray-50 text-gray-900 relative"
      style={{
        backgroundImage:
          'url("https://images.pexels.com/photos/616484/pexels-photo-616484.jpeg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundAttachment: "fixed",
      }}
    >
      <div className="bg-white/20 backdrop-blur-sm min-h-screen w-full pt-6 pb-12 px-6">
        <h1 className="text-4xl font-bold text-center text-yellow-700 mb-10 drop-shadow-md tracking-wide">
          🍴 Explore Delicious Categories
        </h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 justify-items-center">
          {categories.map((cat) => (
            <div
              key={cat.category_id}
              onClick={() => handleCategoryClick(cat.category_name)}
              className="relative group w-64 h-40 rounded-2xl overflow-hidden cursor-pointer 
                         transform transition-all duration-300 hover:scale-105 hover:shadow-2xl"
            >
              {/* Category Image */}
              <img
                src={getImageUrl(cat.img_url)}
                alt={cat.category_name}
                onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_FOOD_IMAGE; }}
                className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity duration-300"
              />

              {/* Overlay for text readability */}
              <div className="absolute inset-0 bg-black/20 opacity-80 group-hover:opacity-10 transition-opacity duration-300"></div>

              {/* Text Content */}
              <div className="absolute bottom-4 left-4 right-4 text-white">
                <h2 className="text-lg font-semibold drop-shadow-[0_2px_3px_rgba(0,0,0,0.9)]">
                  {cat.category_name}
                </h2>
                <p className="text-xs text-gray-200 line-clamp-2 drop-shadow-[0_1px_2px_rgba(0,0,0,0.9)]">
                  {cat.description || `Delicious ${cat.category_name} recipes`}
                </p>
              </div>

              {/* Border highlight on hover */}
              <div className="absolute inset-0 border-2 border-transparent rounded-2xl group-hover:border-yellow-400 transition-all duration-300"></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
