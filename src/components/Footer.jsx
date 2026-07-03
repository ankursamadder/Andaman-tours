import React from "react";
import { useAuth } from "../context/AuthContext.jsx";

export default function Footer() {
  const { user, isAdmin } = useAuth();
  const showAdminPortal = Boolean(user || isAdmin);

  return (
    <footer className="bg-lagoon-900 text-sand-100/80">
      <div className="max-w-7xl mx-auto px-6 lg:px-10 py-14 grid sm:grid-cols-3 gap-10">
        <div>
          <span className="font-display text-xl text-white">Andaman Voyages</span>
          <p className="text-sm mt-3 max-w-xs">
            Locally planned activities across Port Blair, Havelock and Neil Island.
          </p>
        </div>

        <div>
          <p className="text-white font-semibold text-sm mb-3">Contact</p>
          <ul className="space-y-2 text-sm">
            <li>Marine Hill Road, Port Blair, Andaman &amp; Nicobar Islands, India</li>
            <li>+91 98765 43210</li>
            <li>hello@andamanvoyages.example</li>
          </ul>
        </div>

        <div>
          <p className="text-white font-semibold text-sm mb-3">Quick links</p>
          <ul className="space-y-2 text-sm">
            <li>
              <a href="#packages" className="hover:text-white transition-colors">
                Activities
              </a>
            </li>
            <li>
              <a href="#gallery" className="hover:text-white transition-colors">
                Gallery
              </a>
            </li>
            {showAdminPortal && (
              <li>
                <a href="/admin" className="hover:text-white transition-colors">
                  Admin Portal
                </a>
              </li>
            )}
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-5 text-center text-xs">
        &copy; {new Date().getFullYear()} Andaman Voyages. All rights reserved.
      </div>
    </footer>
  );
}
