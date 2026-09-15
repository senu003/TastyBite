import React, { useState, useEffect } from "react";
import feature1 from "../assets/images/foodimg1.jpg";
import feature2 from "../assets/images/foodimg2.jpg";
import feature3 from "../assets/images/foodimg3.jpg";
import feature4 from "../assets/images/foodimg4.jpg";

// Slides array
const slides = [
  {
    image: feature1,
    title: "Welcome to TastBite",
    description:
      "Discover exciting new recipes from around the world and bring them to your kitchen effortlessly.",
  },
  {
    image: feature2,
    title: "Welcome to TastBite",
    description:
      "Easily share your own culinary creations and inspire others with your unique dishes.",
  },
  {
    image: feature3,
    title: "Welcome to TastBite",
    description:
      "Quickly find your most-loved recipes and revisit them anytime you want.",
  },
  {
    image: feature4,
    title: "Welcome to TastBite",
    description:
      "List ingredients efficiently according to your chosen recipes, making cooking simple and stress-free.",
  },
];

export default function FeatureCarousel() {
  const [current, setCurrent] = useState(0);

  // Auto-slide every 4 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const nextSlide = () => setCurrent((prev) => (prev + 1) % slides.length);
  const prevSlide = () => setCurrent((prev) => (prev - 1 + slides.length) % slides.length);

  return (
    <div
      className="relative w-[99%] h-[100vh] md:h-[75vh] overflow-hidden rounded-2xl shadow-lg group my-6 mx-auto"
      style={{ fontFamily: "'Poppins', sans-serif" }}
    >
      {/* Google Fonts */}
      <link
        href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&family=Lobster&display=swap"
        rel="stylesheet"
      />

      {/* Slides */}
      {slides.map((slide, index) => (
        <div
          key={index}
          className={`absolute top-0 left-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100 z-20" : "opacity-0 z-10"
          }`}
        >
          {/* Background Image */}
          <img src={slide.image} alt={slide.title} className="w-full h-full object-cover" />

          {/* Overlay with text */}
          <div className="absolute inset-0 flex flex-row items-center bg-black/40 px-6">
            {/* Left navigation button (shown on hover) */}
            <button
              onClick={prevSlide}
              className="ml-5 mr-8 z-30 p-4 rounded-full bg-gray-700/40 hover:bg-gray-700/70 opacity-0 group-hover:opacity-100 transition duration-300"
            >
              <div
                className="w-0 h-0 border-t-[12px] border-b-[12px] border-r-[18px] border-t-transparent border-b-transparent border-r-gray-300"
              ></div>
            </button>

            {/* Text area */}
            <div
              className={`flex flex-col justify-center ${
                index === 1 ? "items-center text-center w-full" : "items-start text-left"
              } max-w-3xl animate-fadeIn`}
            >
              <h2
                className="text-4xl md:text-5xl font-bold text-yellow-500 mb-4"
                style={{ fontFamily: "'Lobster', cursive" }}
              >
                {slide.title}
              </h2>
              <p className="text-white text-lg md:text-xl leading-relaxed drop-shadow-lg">
                {slide.description}
              </p>
            </div>
          </div>
        </div>
      ))}

      {/* Right navigation button (shown on hover) */}
      <button
        onClick={nextSlide}
        className="absolute right-5 top-1/2 transform -translate-y-1/2 z-30 p-4 rounded-full bg-gray-700/40 hover:bg-gray-700/70 opacity-0 group-hover:opacity-100 transition duration-300"
      >
        <div
          className="w-0 h-0 border-t-[12px] border-b-[12px] border-l-[18px] border-t-transparent border-b-transparent border-l-gray-300"
        ></div>
      </button>

      {/* Dots Navigation */}
      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex space-x-3 z-30">
        {slides.map((_, index) => (
          <button
            key={index}
            onClick={() => setCurrent(index)}
            className={`w-3 h-3 rounded-full transition-all duration-300 ${
              index === current ? "bg-yellow-400 scale-110" : "bg-gray-500"
            }`}
          />
        ))}
      </div>

      {/* Fade-in animation */}
      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.8s ease-in-out;
        }
      `}</style>
    </div>
  );
}
