import React, { useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";

import Header from "./components/header";
import AuthModal from "./components/AuthModal";

// Pages
import Home from "./pages/Home";
import Favorites from "./pages/Favourite";
import Recipes from "./pages/Recipes";
import CategoriesPage from "./pages/Categories";
import Ingredients from "./pages/Ingredients";
import AddRecipe from "./pages/AddRecipe";

function AppContent() {
  const { login } = useAuth();
  const [isAuthOpen, setIsAuthOpen] = useState(false);

  return (
    <Router>
      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onLoginSuccess={(userData, token) => login(userData, token)}
      />

      {/* Header */}
      <Header onLoginClick={() => setIsAuthOpen(true)} />

      <main className="pt-16 w-full">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/favorites" element={<Favorites />} />
          <Route path="/recipes" element={<Recipes />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/ingredients" element={<Ingredients />} />
          <Route path="/add-recipes" element={<AddRecipe />} />
        </Routes>
      </main>
    </Router>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
