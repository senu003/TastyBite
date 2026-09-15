import React, { useState, useEffect } from "react";
import {
  FaSearch,
  FaUserCircle,
  FaHome,
  FaListUl,
  FaUtensils,
  FaHeart,
  FaPlusCircle,
  FaCarrot,
  FaSignOutAlt,
} from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

const Header = ({ onLoginClick }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [activeLink, setActiveLink] = useState(location.pathname);
  const [searchTerm, setSearchTerm] = useState("");

  // Update active link when route changes
  useEffect(() => {
    setActiveLink(location.pathname);
  }, [location.pathname]);

  const navLinks = [
    { name: "Homepage", path: "/", icon: <FaHome /> },
    { name: "Categories", path: "/categories", icon: <FaListUl /> },
    { name: "Recipes", path: "/recipes", icon: <FaUtensils /> },
    { name: "Favourites", path: "/favorites", icon: <FaHeart /> },
    { name: "Ingredients", path: "/ingredients", icon: <FaCarrot /> },
    { name: "Add Recipes", path: "/add-recipes", icon: <FaPlusCircle /> },
  ];

  const handleSearch = () => {
    if (!searchTerm.trim()) return;
    navigate(`/recipes?search=${encodeURIComponent(searchTerm.trim())}`);
    setSearchTerm("");
  };

  return (
    <header className="bg-gradient-to-r from-yellow-100 via-white to-yellow-100 fixed top-0 left-0 w-full shadow-md z-50 border-b border-yellow-200">
      <div className="max-w-10xl mx-auto flex items-center justify-between py-4 px-6 md:px-10">

        {/* 🍴 Logo (Left) */}
        <div className="flex items-center">
          <span className="text-3xl font-bold text-yellow-600 drop-shadow-sm cursor-pointer" onClick={() => navigate('/')}>
            🍴 Tastybite
          </span>
        </div>

        {/* 🧭 Navigation (Center) */}
        <nav className="flex gap-3 items-center justify-center flex-1">
          {navLinks.map((link) => (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all duration-300 shadow-sm
                ${
                  activeLink === link.path
                    ? "bg-yellow-500 text-white shadow-md scale-105"
                    : "bg-white text-yellow-700 hover:bg-yellow-400 hover:text-white"
                }`}
            >
              {link.icon}
              {link.name}
            </Link>
          ))}
        </nav>

        {/* 🔍 Search & 👤 User (Right) */}
        <div className="flex items-center space-x-4">
          {/* Search Box */}
          <div className="flex items-center bg-white border border-yellow-300 rounded-full px-2 py-1 shadow-sm">
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="bg-transparent outline-none px-2 text-sm text-gray-800 w-28 sm:w-40"
            />
            <button
              onClick={handleSearch}
              className="bg-yellow-500 text-white p-2 rounded-full hover:bg-yellow-600 transition-all"
            >
              <FaSearch />
            </button>
          </div>

          {/* User Profile / Logout */}
          {user ? (
            <div className="flex items-center gap-2">
              <div
                className="w-9 h-9 rounded-full bg-yellow-500 flex items-center justify-center text-white font-bold shadow-sm"
                title={user.username || user.email}
              >
                {(user.username || user.email || "U").charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-yellow-800 hidden md:inline">
                {user.username}
              </span>
              <button
                onClick={logout}
                className="text-yellow-700 hover:text-red-600 p-2 rounded-full transition-colors"
                title="Logout"
              >
                <FaSignOutAlt className="text-lg" />
              </button>
            </div>
          ) : (
            <FaUserCircle
              className="text-3xl cursor-pointer text-yellow-600 hover:text-yellow-500 transition-transform hover:scale-110"
              onClick={onLoginClick}
              title="Login / Signup"
            />
          )}
        </div>

      </div>
    </header>
  );
};

export default Header;
