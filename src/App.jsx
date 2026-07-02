import React, { useEffect, useState } from "react";
import Navbar from "./components/Navbar.jsx";
import Hero from "./components/Hero.jsx";
import PackagesGrid from "./components/PackagesGrid.jsx";
import ItineraryModal from "./components/ItineraryModal.jsx";
import WhyUs from "./components/WhyUs.jsx";
import Gallery from "./components/Gallery.jsx";
import Footer from "./components/Footer.jsx";
import AuthModal from "./components/AuthModal.jsx";
import AdminPage from "./pages/AdminPage.jsx";
import packagesSeed from "./data/packages.js";
import { supabase } from "./lib/supabaseClient.js";
import { mergePackageLists, normalizePackageRecord } from "./lib/contentHelpers.js";

export default function App() {
  const pathname = typeof window !== "undefined" ? window.location.pathname : "/";

  if (pathname.startsWith("/admin")) {
    return <AdminPage />;
  }

  return <PublicSite />;
}

function PublicSite() {
  const [activePkg, setActivePkg] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [packages, setPackages] = useState(packagesSeed);

  useEffect(() => {
    let active = true;

    async function loadPackages() {
      const { data, error } = await supabase.from("packages").select("*").order("created_at", { ascending: false });
      if (!active || error) return;
      if (!data || data.length === 0) return;
      const remotePackages = data.map(normalizePackageRecord);
      setPackages(mergePackageLists(packagesSeed, remotePackages));
    }

    loadPackages();
    return () => {
      active = false;
    };
  }, []);

  const toggleSelect = (id) => {
    setSelectedIds((ids) => (ids.includes(id) ? ids.filter((i) => i !== id) : [...ids, id]));
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
      />
      <AuthModal />
    </div>
  );
}
