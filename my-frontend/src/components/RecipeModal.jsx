// src/components/RecipeModal.jsx
import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import { FaClock, FaListUl, FaRegCommentDots, FaTimes, FaStar, FaRegStar, FaEdit, FaTrash } from "react-icons/fa";
import { getImageUrl, DEFAULT_FOOD_IMAGE } from "../utils/imageHelper";
import { useAuth } from "../context/AuthContext";
import EditRecipe from "../pages/EditRecipe";

export default function RecipeModal({ recipeId, onClose, userId: propUserId, onRecipeDeleted, onRecipeUpdated }) {
  const { userId: authUserId, isAuthenticated } = useAuth();
  const userId = propUserId ?? authUserId;

  const [data, setData] = useState(null);
  const [commentText, setCommentText] = useState("");
  const [isVisible, setIsVisible] = useState(false);

  // Rating state
  const [myRating, setMyRating] = useState(null);   // user's current rating (1-5 or null)
  const [hoverRating, setHoverRating] = useState(0); // star hover
  const [ratingMsg, setRatingMsg] = useState("");

  // Edit/delete state
  const [showEdit, setShowEdit] = useState(false);
  const [deleteMsg, setDeleteMsg] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Show modal with animation
  useEffect(() => { setIsVisible(true); }, []);

  // Hide footer when modal opens
  useEffect(() => {
    const footer = document.querySelector("footer");
    if (footer) footer.style.display = "none";
    return () => { if (footer) footer.style.display = ""; };
  }, []);

  // Fetch recipe data
  const fetchRecipe = useCallback(() => {
    if (!recipeId) return;
    axios
      .get(`/api/recipes/${recipeId}`)
      .then((res) => setData(res.data))
      .catch((err) => console.error("RecipeModal fetch error:", err));
  }, [recipeId]);

  useEffect(() => { fetchRecipe(); }, [fetchRecipe]);

  // Fetch the current user's rating for this recipe
  useEffect(() => {
    if (!recipeId || !isAuthenticated || !userId) return;
    axios
      .get(`/api/recipes/${recipeId}/my-rating`, { params: { user_id: userId } })
      .then((res) => setMyRating(res.data.rating ?? null))
      .catch((err) => console.error("my-rating fetch error:", err));
  }, [recipeId, userId, isAuthenticated]);

  // Submit a rating (1-5)
  const handleRate = async (star) => {
    if (!isAuthenticated || !userId) {
      setRatingMsg("Please log in to rate this recipe.");
      return;
    }
    try {
      setRatingMsg("");
      const res = await axios.post(`/api/recipes/${recipeId}/rate`, {
        user_id: userId,
        rating: star,
      });
      setMyRating(star);
      // Update the locally shown avg/count without a full refetch
      setData((prev) => ({
        ...prev,
        recipe: {
          ...prev.recipe,
          avg_rating: res.data.avg_rating,
          total_ratings: res.data.total_ratings,
        },
      }));
      // Propagate updated stats to parent list
      if (onRecipeUpdated) {
        onRecipeUpdated(recipeId, {
          avg_rating: res.data.avg_rating,
          total_ratings: res.data.total_ratings,
        });
      }
      setRatingMsg(`✅ Rated ${star} star${star > 1 ? "s" : ""}!`);
      setTimeout(() => setRatingMsg(""), 2500);
    } catch (err) {
      console.error("Rating error:", err);
      setRatingMsg("❌ Failed to submit rating. Try again.");
    }
  };

  // Add comment
  const handleAddComment = () => {
    if (!commentText.trim()) return;
    if (!isAuthenticated || !userId) {
      alert("Please log in to post a comment.");
      return;
    }
    axios
      .post(`/api/recipes/${recipeId}/comments`, {
        user_id: userId,
        comment: commentText,
      })
      .then((res) => {
        setData((prev) => ({
          ...prev,
          comments: [
            {
              comment_id: res.data.comment_id,
              user_id: userId,
              comment: commentText,
              created_at: new Date(),
            },
            ...(prev.comments || []),
          ],
        }));
        setCommentText("");
      })
      .catch((err) => console.error("Comment error:", err));
  };

  // Delete recipe
  const handleDelete = async () => {
    if (!window.confirm("Are you sure you want to delete this recipe? This cannot be undone.")) return;
    setDeleting(true);
    setDeleteMsg("");
    try {
      await axios.delete(`/api/recipes/${recipeId}`, {
        data: { user_id: userId },
      });
      // Close modal then notify parent to remove from list
      closeModal();
      if (onRecipeDeleted) onRecipeDeleted(recipeId);
    } catch (err) {
      console.error("Delete error:", err);
      const msg = err.response?.data?.message || "Failed to delete recipe.";
      setDeleteMsg(`❌ ${msg}`);
    } finally {
      setDeleting(false);
    }
  };

  // After edit succeeds: re-fetch and exit edit mode
  const handleEditSuccess = () => {
    setShowEdit(false);
    fetchRecipe();
    if (onRecipeUpdated) onRecipeUpdated(recipeId, null); // signal parent to refetch list
  };

  const closeModal = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  if (!data) return null;

  const isOwner = userId && Number(data.recipe?.user_id) === Number(userId);

  return (
    <div className="fixed inset-0 z-[999] flex justify-center items-center p-4">
      {/* Background blur overlay */}
      <div
        className={`absolute inset-0 bg-black/50 backdrop-blur-md transition-opacity duration-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
        onClick={closeModal}
      />

      {/* Modal container */}
      <div
        className={`relative z-20 rounded-3xl max-w-4xl w-full max-h-[90vh] shadow-2xl overflow-hidden border border-white/40
          transform transition-all duration-300 ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
        style={{
          backgroundImage: "url('https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
        }}
      >
        {/* White overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/90 to-white/80" />

        {/* Scrollable content */}
        <div className="relative z-20 p-6 overflow-y-auto max-h-[85vh] text-gray-800">
          {/* Close button */}
          <button
            onClick={closeModal}
            className="fixed top-6 right-8 z-[1000] bg-white/80 backdrop-blur-md border border-gray-200
              text-gray-700 hover:text-white hover:bg-amber-500 transition-all
              duration-300 shadow-lg w-10 h-10 flex items-center justify-center
              rounded-full hover:scale-105 active:scale-95"
            title="Close"
          >
            <FaTimes size={18} />
          </button>

          {/* ---- SHOW EDIT FORM or RECIPE DETAILS ---- */}
          {showEdit ? (
            <EditRecipe
              recipeId={recipeId}
              initialData={data}
              onSuccess={handleEditSuccess}
              onCancel={() => setShowEdit(false)}
            />
          ) : (
            <>
              {/* Title */}
              <h2 className="text-4xl font-bold text-center mb-3 text-amber-700 drop-shadow-md">
                {data.recipe?.title}
              </h2>

              {/* Description */}
              <p className="text-center italic text-gray-600 mb-4">{data.recipe?.description}</p>

              {/* Recipe Image */}
              <div className="flex justify-center mb-6">
                <img
                  className="w-52 md:w-1/3 h-52 object-cover rounded-2xl shadow-xl border-4 border-white"
                  src={getImageUrl(data.recipe?.image_url)}
                  alt={data.recipe?.title}
                  onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_FOOD_IMAGE; }}
                />
              </div>

              {/* Cooking info + avg rating */}
              <div className="flex justify-center items-center gap-6 mb-5 flex-wrap">
                <div className="flex items-center gap-2">
                  <FaClock className="text-amber-600" />
                  <span className="font-semibold text-gray-700">{data.recipe.cooking_time} mins</span>
                </div>
                <div className="flex items-center gap-1 text-yellow-500 font-semibold">
                  <FaStar />
                  <span>{Number(data.recipe.avg_rating || 0).toFixed(1)}</span>
                  <span className="text-gray-500 font-normal text-sm ml-1">
                    ({data.recipe.total_ratings || 0} rating{data.recipe.total_ratings !== 1 ? "s" : ""})
                  </span>
                </div>
              </div>

              {/* ---- STAR RATING UI ---- */}
              <div className="flex flex-col items-center mb-6">
                {isAuthenticated ? (
                  <>
                    <p className="text-sm text-gray-500 mb-2">
                      {myRating ? `Your rating: ${myRating} ★ — click to change` : "Rate this recipe:"}
                    </p>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((star) => {
                        const filled = star <= (hoverRating || myRating || 0);
                        return (
                          <button
                            key={star}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            onClick={() => handleRate(star)}
                            className="text-3xl transition-transform hover:scale-125 focus:outline-none"
                            title={`Rate ${star} star${star > 1 ? "s" : ""}`}
                            aria-label={`Rate ${star} star${star > 1 ? "s" : ""}`}
                          >
                            {filled
                              ? <FaStar className="text-yellow-400" />
                              : <FaRegStar className="text-yellow-400" />}
                          </button>
                        );
                      })}
                    </div>
                    {ratingMsg && (
                      <p className="text-sm mt-1 font-medium text-amber-700">{ratingMsg}</p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500 italic bg-amber-50 px-4 py-2 rounded-lg border border-amber-200">
                    🔒 Log in to rate this recipe
                  </p>
                )}
              </div>

              {/* ---- OWNER EDIT / DELETE ---- */}
              {isOwner && (
                <div className="flex justify-center gap-3 mb-6">
                  <button
                    onClick={() => setShowEdit(true)}
                    className="flex items-center gap-2 bg-amber-100 hover:bg-amber-200 text-amber-800 font-semibold px-4 py-2 rounded-full shadow transition"
                  >
                    <FaEdit /> Edit Recipe
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting}
                    className="flex items-center gap-2 bg-red-100 hover:bg-red-200 text-red-700 font-semibold px-4 py-2 rounded-full shadow transition disabled:opacity-60"
                  >
                    <FaTrash /> {deleting ? "Deleting..." : "Delete Recipe"}
                  </button>
                </div>
              )}
              {deleteMsg && (
                <p className="text-center text-sm text-red-600 mb-4">{deleteMsg}</p>
              )}

              {/* Ingredients */}
              <h3 className="flex items-center justify-center gap-2 font-semibold text-lg text-amber-700 mb-2">
                <FaListUl /> Ingredients
              </h3>
              <ul className="list-disc list-inside mb-5 text-center text-gray-700">
                {data.ingredients.map((ing, idx) => (
                  <li key={idx}>
                    <span className="font-medium">{ing.ingredient_name}</span> – {ing.quantity}
                  </li>
                ))}
              </ul>

              {/* Steps */}
              <h3 className="flex items-center justify-center gap-2 font-semibold text-lg text-amber-700 mb-2">
                🍳 Steps
              </h3>
              <ol className="list-decimal list-inside space-y-1 text-gray-700 text-center mb-6">
                {data.steps.map((step, idx) => (
                  <li key={idx}>{step.instruction}</li>
                ))}
              </ol>

              {/* Comments */}
              <h3 className="flex items-center gap-2 font-semibold text-lg text-amber-700 mb-2">
                <FaRegCommentDots /> Comments
              </h3>
              <div className="max-h-40 overflow-y-auto bg-white/60 rounded-lg p-3 mb-4 shadow-inner">
                {data.comments.length > 0 ? (
                  data.comments.map((c) => (
                    <div key={c.comment_id} className="border-b border-gray-300 py-1 text-gray-700">
                      <span className="font-semibold text-amber-700">User {c.user_id}:</span>{" "}
                      {c.comment}
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm italic">
                    No comments yet. Be the first to share your thoughts!
                  </p>
                )}
              </div>

              {/* Add Comment */}
              <div className="flex gap-2">
                <input
                  type="text"
                  className="border border-amber-300 p-2 flex-1 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500 bg-white/80 placeholder-gray-500"
                  placeholder={isAuthenticated ? "Add a comment..." : "Log in to comment"}
                  value={commentText}
                  onChange={(e) => setCommentText(e.target.value)}
                  disabled={!isAuthenticated}
                />
                <button
                  onClick={handleAddComment}
                  disabled={!isAuthenticated}
                  className="bg-amber-500 text-white px-4 py-2 rounded-lg hover:bg-amber-600 active:scale-95 transition font-semibold shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Post
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
