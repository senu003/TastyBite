import React, { useState, useEffect } from "react";
import axios from "axios";
import { FiPlus, FiTrash2 } from "react-icons/fi";
import { useAuth } from "../context/AuthContext";

export default function AddRecipe() {
  const { userId: user_id, isAuthenticated } = useAuth();
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [newCategory, setNewCategory] = useState("");
  const [description, setDescription] = useState("");
  const [ingredients, setIngredients] = useState([""]);
  const [steps, setSteps] = useState([""]);
  const [cookingTime, setCookingTime] = useState("");
  const [image, setImage] = useState(null);
  const [preview, setPreview] = useState(null);
  const [categories, setCategories] = useState([]);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/api/categories");
        setCategories(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        console.error("Error fetching categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Resize image to match card dimensions (e.g., 400x300)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) {
      setPreview(null);
      setImage(null);
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        const WIDTH = 400;
        const HEIGHT = 300;
        canvas.width = WIDTH;
        canvas.height = HEIGHT;

        // Draw the image scaled to fit the canvas
        ctx.drawImage(img, 0, 0, WIDTH, HEIGHT);

        canvas.toBlob(
          (blob) => {
            const resizedFile = new File([blob], file.name, { type: file.type });
            setImage(resizedFile);
            setPreview(URL.createObjectURL(resizedFile));
          },
          file.type,
          0.9
        );
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleIngredientChange = (index, field, value) => {
    const newIngredients = [...ingredients];
    newIngredients[index] = { ...newIngredients[index], [field]: value };
    setIngredients(newIngredients);
  };
  const addIngredient = () => setIngredients([...ingredients, { name: "", quantity: "" }]);
  const removeIngredient = (index) =>
    setIngredients(ingredients.filter((_, i) => i !== index));

  const handleStepChange = (index, value) => {
    const newSteps = [...steps];
    newSteps[index] = value;
    setSteps(newSteps);
  };
  const addStep = () => setSteps([...steps, ""]);
  const removeStep = (index) => setSteps(steps.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    const finalCategoryId = categoryId === "new" ? null : categoryId;

    if (!isAuthenticated || !user_id) {
      setMessage("⚠️ You must be logged in to add a recipe.");
      return;
    }

    if (
      !title.trim() ||
      (!finalCategoryId && !newCategory.trim()) ||
      !description.trim() ||
      !cookingTime.trim() ||
      !image ||
      ingredients.filter((i) => i.name && i.name.trim()).length === 0 ||
      steps.filter((s) => s.trim()).length === 0
    ) {
      setMessage("⚠️ Please fill all fields.");
      return;
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

    setMessage("⏳ Uploading recipe...");

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("description", description);
      formData.append("cooking_time", cookingTime);
      formData.append("user_id", user_id);
      if (finalCategoryId) formData.append("category_id", finalCategoryId);
      if (newCategory) formData.append("newCategory", newCategory);
      formData.append("ingredients", JSON.stringify(formattedIngredients));
      formData.append("steps", JSON.stringify(formattedSteps));
      if (image) {
        formData.append("image", image);
      }

      await axios.post("/api/add-recipe", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setMessage("✅ Recipe added successfully!");
      setTitle("");
      setCategoryId("");
      setNewCategory("");
      setDescription("");
      setCookingTime("");
      setImage(null);
      setPreview(null);
      setIngredients([{ name: "", quantity: "" }]);
      setSteps([""]);
    } catch (err) {
      console.error(err);
      setMessage("❌ Error adding recipe. Try again.");
    }
  };

  return (
    <div
      className="min-h-screen relative bg-fixed bg-center bg-cover overflow-y-auto no-scrollbar" // replaced hide-scrollbar with Tailwind overflow utility + helper class
      style={{
        backgroundImage:
          "url('https://images.pexels.com/photos/376464/pexels-photo-376464.jpeg')",
      }}
    >
      {/* Inline CSS to hide scrollbars across browsers (keeps tailwind for layout) */}
      <style>{`
        /* Hide scrollbar for WebKit browsers */
        .no-scrollbar::-webkit-scrollbar { display: none; }
        /* Hide scrollbar for IE, Edge */
        .no-scrollbar { -ms-overflow-style: none; }
        /* Hide scrollbar for Firefox */
        .no-scrollbar { scrollbar-width: none; }
      `}</style>

      <div className="bg-white/20 backdrop-blur-md min-h-screen w-full pt-6 pb-12 px-6">
        <h1 className="text-4xl font-bold text-center text-yellow-700 mb-10 drop-shadow-md tracking-wide">
          🍳 Add Your Recipe
        </h1>

        <div className="max-w-3xl mx-auto bg-white/90 backdrop-blur-sm shadow-xl rounded-2xl p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-yellow-800 mb-1">
                Recipe Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full border border-yellow-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                placeholder="Delicious Spaghetti"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-yellow-800 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full border border-yellow-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none"
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
                <label className="block text-sm font-medium text-yellow-800 mb-1">
                  New Category Name
                </label>
                <input
                  type="text"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full border border-yellow-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                  placeholder="Dessert"
                />
              </div>
            )}

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-yellow-800 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="3"
                className="w-full border border-yellow-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none resize-none"
                placeholder="Write a short description of your recipe..."
              />
            </div>

            {/* Cooking Time */}
            <div>
              <label className="block text-sm font-medium text-yellow-800 mb-1">
                Cooking Time (minutes)
              </label>
              <input
                type="number"
                value={cookingTime}
                onChange={(e) => setCookingTime(e.target.value)}
                className="w-full border border-yellow-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                placeholder="30"
              />
            </div>

            {/* Ingredients */}
            <div className="bg-yellow-50 p-4 rounded-lg shadow-sm">
              <label className="block text-sm font-medium text-yellow-800 mb-2">
                Ingredients & Quantities / Units
              </label>
              {ingredients.map((ing, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={ing.name || ""}
                    onChange={(e) => handleIngredientChange(index, "name", e.target.value)}
                    className="flex-1 border border-yellow-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                    placeholder={`Ingredient Name (e.g. Flour)`}
                  />
                  <input
                    type="text"
                    value={ing.quantity || ""}
                    onChange={(e) => handleIngredientChange(index, "quantity", e.target.value)}
                    className="w-1/3 border border-yellow-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                    placeholder={`Qty / Unit (e.g. 500g, 2 cups)`}
                  />
                  <button
                    type="button"
                    onClick={() => removeIngredient(index)}
                    className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-md transition transform hover:scale-110"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addIngredient}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full shadow-md transition transform hover:scale-105 mt-2 font-medium"
              >
                <FiPlus /> Add Ingredient
              </button>
            </div>

            {/* Steps */}
            <div className="bg-yellow-50 p-4 rounded-lg shadow-sm">
              <label className="block text-sm font-medium text-yellow-800 mb-2">
                Steps
              </label>
              {steps.map((step, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={step}
                    onChange={(e) => handleStepChange(index, e.target.value)}
                    className="flex-1 border border-yellow-300 rounded-lg p-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                    placeholder={`Step ${index + 1}`}
                  />
                  <button
                    type="button"
                    onClick={() => removeStep(index)}
                    className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-full shadow-md transition transform hover:scale-110"
                  >
                    <FiTrash2 />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={addStep}
                className="flex items-center gap-2 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-full shadow-md transition transform hover:scale-105 mt-2 font-medium"
              >
                <FiPlus /> Add Step
              </button>
            </div>

            {/* Image */}
            <div>
              <label className="block text-sm font-medium text-yellow-800 mb-1">
                Recipe Image
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="w-full border border-yellow-300 rounded-lg p-2 bg-white cursor-pointer"
              />
              {preview && (
                <img
                  src={preview}
                  alt="Preview"
                  className="mt-3 rounded-2xl shadow-md w-full object-cover h-48"
                />
              )}
            </div>

            <button
              type="submit"
              className="w-full bg-yellow-500 text-white font-semibold py-2 rounded-full shadow-md hover:bg-yellow-600 transition-all"
            >
              Add Recipe
            </button>
          </form>

          {message && (
            <p className="mt-4 text-center text-yellow-800 font-medium">{message}</p>
          )}
        </div>
      </div>
    </div>
  );
}
