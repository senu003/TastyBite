import React, { useState } from "react";
import axios from "axios";

export default function AuthModal({ isOpen, onClose, onLoginSuccess }) {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState(""); // for signup
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (!isOpen) return null;

  const handleLogin = async () => {
    setError("");
    if (!email || !password) return setError("All fields required");

    try {
      const res = await axios.post("/api/login", { email, password });
      if (res.data.success) {
        onLoginSuccess({ ...res.data.user, token: res.data.token }, res.data.token);
        setEmail("");
        setPassword("");
        onClose();
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Try again.");
    }
  };

  const handleSignup = async () => {
    setError("");
    if (!username || !email || !password) return setError("All fields required");

    try {
      const res = await axios.post("/api/signup", { username, email, password });
      if (res.data.success) {
        onLoginSuccess({ ...res.data.user, token: res.data.token }, res.data.token);
        setUsername("");
        setEmail("");
        setPassword("");
        onClose();
      } else {
        setError(res.data.message);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Signup failed. Try again.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 backdrop-blur-sm">
      <div className="relative bg-gradient-to-br from-yellow-100 to-orange-200 p-8 rounded-2xl shadow-xl w-96">
        <h2 className="text-3xl font-bold mb-6 text-center text-orange-700">
          {isLogin ? "Login" : "Signup"}
        </h2>

        {!isLogin && (
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full mb-3 p-3 rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
          />
        )}

        <input
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full mb-3 p-3 rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />
        <input
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full mb-3 p-3 rounded-lg border border-orange-300 focus:outline-none focus:ring-2 focus:ring-orange-400"
        />

        {error && <p className="text-red-500 mb-3 text-center">{error}</p>}

        <button
          onClick={isLogin ? handleLogin : handleSignup}
          className="w-full mb-4 bg-orange-500 hover:bg-orange-600 text-white py-3 rounded-lg font-semibold transition-all duration-300"
        >
          {isLogin ? "Login" : "Signup"}
        </button>

        <p className="text-center text-orange-800">
          {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
          <span
            onClick={() => {
              setError("");
              setIsLogin(!isLogin);
            }}
            className="font-bold cursor-pointer underline hover:text-orange-600"
          >
            {isLogin ? "Signup" : "Login"}
          </span>
        </p>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-orange-700 hover:text-orange-900 font-bold text-xl"
        >
          &times;
        </button>
      </div>
    </div>
  );
}
