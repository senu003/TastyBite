import React from "react";

import Footer from "../components/footer";
import FeatureCarousel from "../components/FeatureCarousel";
import HighRatedRecipes from "../components/HighRatedRecipes";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      {/* Fixed Header */}
      

      {/* Main content (scrollable area) */}
      <main className="flex-grow overflow-auto pt-2 pb-30 scrollbar-hide"> {/* Added scrollbar-hide class */}
        <FeatureCarousel />
        <HighRatedRecipes /> {/* Recipe cards added here */}
      </main>

      {/* Fixed Footer */}
      <footer className="fixed bottom-0 left-0 w-full z-50">
        <Footer />
      </footer>
    </div>
  );
}
