import React, { useEffect, useState } from "react";

import axios from "axios";
import { useAuth } from "../context/AuthContext";

export default function Ingredients() {
  const { userId: user_id, isAuthenticated } = useAuth();
  const [ingredients, setIngredients] = useState([]);
  const [checked, setChecked] = useState({});

  useEffect(() => {
    if (!isAuthenticated) return;
    axios.get("/api/favorite-ingredients")
      .then(res => {
        const data = Array.isArray(res.data) ? res.data : [];
        setIngredients(data);
        const checkedState = {};
        data.forEach(item => {
          checkedState[item.ingredient_id] = item.have === 1 || item.have === true;
        });
        setChecked(checkedState);
      })
      .catch(err => console.error(err));
  }, [isAuthenticated]);

  const handleToggle = (id) => {
    if (!isAuthenticated) return;
    const newValue = !checked[id];
    setChecked(prev => ({ ...prev, [id]: newValue }));

    axios.post("/api/ingredient-status", { ingredient_id: id, have: newValue })
      .catch(err => console.error(err));
  };

  const markAll = () => {
    if (!isAuthenticated) return;
    const newChecked = {};
    ingredients.forEach(i => newChecked[i.ingredient_id] = true);
    setChecked(newChecked);

    ingredients.forEach(i => 
      axios.post("/api/ingredient-status", { ingredient_id: i.ingredient_id, have: true })
        .catch(err => console.error(err))
    );
  };

  const clearAll = () => {
    if (!isAuthenticated) return;
    const newChecked = {};
    ingredients.forEach(i => newChecked[i.ingredient_id] = false);
    setChecked(newChecked);

    ingredients.forEach(i =>
      axios.post("/api/ingredient-status", { ingredient_id: i.ingredient_id, have: false })
        .catch(err => console.error(err))
    );
  };

  if (!isAuthenticated)
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 text-center shadow-xl">
          <p className="text-yellow-800 text-lg font-semibold mb-2">Please log in to view your ingredients</p>
          <p className="text-gray-500 text-sm">Ingredients from your favorited recipes will appear here.</p>
        </div>
      </div>
    );

  return (
    <div
      className="min-h-screen relative bg-fixed bg-center bg-cover"
      style={{
        backgroundImage:
          "url('https://images.pexels.com/photos/8716167/pexels-photo-8716167.jpeg')",
      }}
    >
      

      {/* Overlay + blur */}
      <div className="bg-white/20 backdrop-blur-sm min-h-screen w-full pt-6 pb-12 px-6">
        <h1 className="text-4xl font-bold text-center text-yellow-700 mb-10 drop-shadow-md tracking-wide">
          🥗 Ingredients Checklist
        </h1>

        {/* Buttons */}
        <div className="flex justify-center gap-4 mb-8">
          <button 
            onClick={markAll} 
            className="bg-green-500 text-white px-5 py-2 rounded-full hover:bg-green-600 transition-all"
          >
            Mark all as available
          </button>
          <button 
            onClick={clearAll} 
            className="bg-red-500 text-white px-5 py-2 rounded-full hover:bg-red-600 transition-all"
          >
            Clear all
          </button>
        </div>

        {ingredients.length === 0 && <p className="text-center text-gray-200">No ingredients found.</p>}

        {/* Ingredients list card */}
        <div className="max-w-3xl mx-auto bg-white/70 backdrop-blur-sm shadow-lg rounded-2xl p-6">
          <ul>
            {ingredients.map(ing => (
              <li key={ing.ingredient_id} className="flex flex-col border-b border-gray-300 py-3">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-800">{ing.ingredient_name} ({ing.total_quantity})</span>
                  <input
                    type="checkbox"
                    checked={checked[ing.ingredient_id] || false}
                    onChange={() => handleToggle(ing.ingredient_id)}
                    className="w-5 h-5 accent-yellow-500"
                  />
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Used in: {ing.used_in_recipes}
                </p>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
