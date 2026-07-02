import React, { useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import PackagesGrid from "./components/PackagesGrid.jsx";
import ItineraryModal from "./components/ItineraryModal.jsx";
import WhyUs from "./components/WhyUs.jsx";
import Gallery from "./components/Gallery.jsx";
import Footer from "./components/Footer.jsx";
import AuthModal from "./components/AuthModal.jsx";
import packages from "./data/packages.js";

export default function App() {
  const [activePkg, setActivePkg] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  const toggleSelect = (id) => {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
  };

  const handleEnquireFromModal = (pkg) => {
    setSelectedIds((ids) => (ids.includes(pkg.id) ? ids : [...ids, pkg.id]));
  };

  return (
    <div className="min-h-screen bg-sand-50">
      <Navbar />
      <Hero />
      <PackagesGrid
        packages={packages}
        onView={setActivePkg}
        selectedIds={selectedIds}
        onToggleSelect={toggleSelect}
      />
      <WhyUs />
      <Gallery />
      <Footer />

      <ItineraryModal
        pkg={activePkg}
        onClose={() => setActivePkg(null)}
        onEnquire={handleEnquireFromModal}
      />
      <AuthModal />
    </div>
  );
}
