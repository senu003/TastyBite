// src/pages/EditRecipe.jsx
// Inline edit form for the recipe owner. Rendered inside RecipeModal.
import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export default function EditRecipe({ recipeId, initialData, onSuccess, onCancel }) {
  const { userId: user_id } = useAuth();

  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [description, setDescription] = useState("");
  const [cookingTime, setCookingTime] = useState("");
  const [ingredients, setIngredients] = useState([{ name: "", quantity: "" }]);
  const [steps, setSteps] = useState([""]);
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Pre-fill form from initialData passed by the modal
  useEffect(() => {
    if (!initialData) return;
    const { recipe, ingredients: ings, steps: stps } = initialData;
    setTitle(recipe.title || "");
    setCategoryId(recipe.category_id ? String(recipe.category_id) : "");
    setDescription(recipe.description || "");
    setCookingTime(recipe.cooking_time ? String(recipe.cooking_time) : "");
    setPreview(recipe.image_url || null);

    const ingList = Array.isArray(ings) && ings.length > 0
      ? ings.map((i) => ({ name: i.ingredient_name || "", quantity: i.quantity || "" }))
      : [{ name: "", quantity: "" }];
    setIngredients(ingList);

    const stepInstructions = Array.isArray(stps) && stps.length > 0
      ? stps.map((s) => s.instruction || "")
      : [""];
    setSteps(stepInstructions);
  }, [initialData]);

  // Fetch categories on mount
  useEffect(() => {
    axios.get("/api/categories")
      .then((res) => setCategories(Array.isArray(res.data) ? res.data : []))
      .catch((err) => console.error("Error fetching categories:", err));
  }, []);

  // Resize image before upload (same logic as AddRecipe)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) { setImage(null); setPreview(null); return; }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 400;
        canvas.height = 300;
        canvas.getContext("2d").drawImage(img, 0, 0, 400, 300);
        canvas.toBlob((blob) => {
          const resized = new File([blob], file.name, { type: file.type });
          setImage(resized);
          setPreview(URL.createObjectURL(resized));
        }, file.type, 0.9);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleIngredientChange = (i, field, v) => {
    const arr = [...ingredients];
    arr[i] = { ...arr[i], [field]: v };
    setIngredients(arr);
  };
  const addIngredient = () => setIngredients([...ingredients, { name: "", quantity: "" }]);
  const removeIngredient = (i) => setIngredients(ingredients.filter((_, idx) => idx !== i));

  const handleStepChange = (i, v) => {
    const arr = [...steps]; arr[i] = v; setSteps(arr);
  };
  const addStep = () => setSteps([...steps, ""]);
  const removeStep = (i) => setSteps(steps.filter((_, idx) => idx !== i));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCategoryId = categoryId === "new" ? null : categoryId;

    if (!title.trim()) { setMessage("⚠️ Title is required."); return; }
    if (!cookingTime.trim() || isNaN(Number(cookingTime))) {
      setMessage("⚠️ Valid cooking time is required."); return;
    }
    if (ingredients.filter((i) => i.name && i.name.trim()).length === 0) {
      setMessage("⚠️ At least one ingredient is required."); return;
    }
    if (steps.filter((s) => s.trim()).length === 0) {
      setMessage("⚠️ At least one step is required."); return;
    }

    const formattedIngredients = ingredients
      .filter((i) => i.name && i.name.trim())
      .map((i) => ({
        name: i.name.trim(),
        quantity: i.quantity && i.quantity.trim() ? i.quantity.trim() : "1 unit",
      }));
    const formattedSteps = steps
      .filter((s) => s.trim())
      .map((instruction) => ({ instruction: instruction.trim() }));

    setSubmitting(true);
    setMessage("⏳ Saving changes...");

    try {
      const formData = new FormData();
      formData.append("user_id", user_id);
      formData.append("title", title.trim());
      formData.append("description", description.trim());
      formData.append("cooking_time", cookingTime);
      if (finalCategoryId) formData.append("category_id", finalCategoryId);
      if (categoryId === "new" && newCategory.trim()) formData.append("newCategory", newCategory.trim());
      formData.append("ingredients", JSON.stringify(formattedIngredients));
      formData.append("steps", JSON.stringify(formattedSteps));
      if (image) formData.append("image", image);

      await axios.put(`/api/recipes/${recipeId}`, formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("✅ Recipe updated successfully!");
      // Let parent know so it can refresh
      if (onSuccess) onSuccess();
    } catch (err) {
      console.error("Error updating recipe:", err);
      const msg = err.response?.data?.message || "Failed to update recipe.";
      setMessage(`❌ ${msg}`);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-amber-700 mb-2">✏️ Edit Recipe</h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-yellow-800 mb-1">Recipe Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full border border-yellow-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
            placeholder="Delicious Spaghetti"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-yellow-800 mb-1">Category</label>
          <select
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
            className="w-full border border-yellow-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
          >
            <option value="">-- Select Category --</option>
            {categories.map((cat) => (
              <option key={cat.category_id} value={cat.category_id}>
                {cat.category_name}
              </option>
            ))}
            <option value="new">➕ Add New Category</option>
          </select>
        </div>

        {categoryId === "new" && (
          <div>
            <label className="block text-sm font-medium text-yellow-800 mb-1">New Category Name</label>
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="w-full border border-yellow-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
              placeholder="Dessert"
            />
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-yellow-800 mb-1">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows="2"
            className="w-full border border-yellow-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none resize-none text-sm"
            placeholder="Short description..."
          />
        </div>

        {/* Cooking Time */}
        <div>
          <label className="block text-sm font-medium text-yellow-800 mb-1">Cooking Time (minutes)</label>
          <input
            type="number"
            value={cookingTime}
            onChange={(e) => setCookingTime(e.target.value)}
            className="w-full border border-yellow-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
            placeholder="30"
          />
        </div>

        {/* Ingredients */}
        <div className="bg-yellow-50 p-3 rounded-lg">
          <label className="block text-sm font-medium text-yellow-800 mb-2">Ingredients & Quantities / Units</label>
          {ingredients.map((ing, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={ing.name || ""}
                onChange={(e) => handleIngredientChange(i, "name", e.target.value)}
                className="flex-1 border border-yellow-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
                placeholder={`Ingredient Name (e.g. Pasta)`}
              />
              <input
                type="text"
                value={ing.quantity || ""}
                onChange={(e) => handleIngredientChange(i, "quantity", e.target.value)}
                className="w-1/3 border border-yellow-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
                placeholder={`Qty / Unit (e.g. 200g)`}
              />
              <button
                type="button"
                onClick={() => removeIngredient(i)}
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow transition"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addIngredient}
            className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-full text-sm shadow transition mt-1"
          >
            <FiPlus /> Add Ingredient
          </button>
        </div>

        {/* Steps */}
        <div className="bg-yellow-50 p-3 rounded-lg">
          <label className="block text-sm font-medium text-yellow-800 mb-2">Steps</label>
          {steps.map((step, i) => (
            <div key={i} className="flex items-center gap-2 mb-2">
              <input
                type="text"
                value={step}
                onChange={(e) => handleStepChange(i, e.target.value)}
                className="flex-1 border border-yellow-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none text-sm"
                placeholder={`Step ${i + 1}`}
              />
              <button
                type="button"
                onClick={() => removeStep(i)}
                className="bg-red-500 hover:bg-red-600 text-white p-2 rounded-full shadow transition"
              >
                <FiTrash2 size={14} />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addStep}
            className="flex items-center gap-1 bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 rounded-full text-sm shadow transition mt-1"
          >
            <FiPlus /> Add Step
          </button>
        </div>

        {/* Image */}
        <div>
          <label className="block text-sm font-medium text-yellow-800 mb-1">
            Recipe Image <span className="text-gray-400 font-normal">(leave blank to keep current)</span>
          </label>
          <input
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            className="w-full border border-yellow-300 rounded-lg p-2 bg-white cursor-pointer text-sm"
          />
          {preview && (
            <img
              src={preview}
              alt="Preview"
              className="mt-2 rounded-xl shadow w-full object-cover h-36"
            />
          )}
        </div>

        {/* Action buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 bg-amber-500 text-white font-semibold py-2 rounded-full shadow hover:bg-amber-600 transition disabled:opacity-60"
          >
            {submitting ? "Saving..." : "Save Changes"}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 text-gray-700 font-semibold py-2 rounded-full shadow hover:bg-gray-300 transition"
          >
            Cancel
          </button>
        </div>
      </form>

      {message && (
        <p className="text-center text-sm font-medium text-amber-800 mt-2">{message}</p>
      )}
    </div>
  );
}
