import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { BRAND } from "../../mock/mock";
import { LogIn, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function SiteHeader({ onLogin }) {
  const navigate = useNavigate();
  const [scrolled, setScrolled] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // ✅ sync auth state
  useEffect(() => {
    const token = localStorage.getItem("vespera_token");
    setIsLoggedIn(!!token);
  }, []);

  // scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const goDashboard = () => {
    navigate("/dashboard/admin");
  };

  const logout = () => {
    localStorage.removeItem("vespera_token");
    setIsLoggedIn(false);
    navigate("/", { replace: true });
    window.location.reload();
  };

  return (
    <header
      className={`sticky top-0 inset-x-0 z-50 transition-colors ${
        scrolled
          ? "bg-black/70 backdrop-blur-md border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <nav className="w-full px-4 md:px-6 py-4 grid grid-cols-[auto_1fr_auto] items-center">
        <a
          href="/#home"
          className="brand-link text-[15px] tracking-[0.25em] text-white font-semibold"
        >
          {BRAND.name}
        </a>

        <div className="hidden md:flex justify-center items-center gap-8 text-sm">
          <a href="/#home" className="nav-link">Home</a>
          <a href="/#about" className="nav-link">About</a>
          <a href="/#services" className="nav-link">Services</a>
          <a href="/#properties" className="nav-link">Properties</a>
          <a href="/#work" className="nav-link">Work With Us</a>
        </div>

        <div className="flex items-center gap-2">
          {isLoggedIn ? (
            <>
              <Button onClick={goDashboard} className="gold-btn gold-shine">
                <LogIn className="h-4 w-4 mr-2" />
                Dashboard
              </Button>

              <Button
                onClick={logout}
                variant="ghost"
                className="text-red-400 hover:text-red-300"
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </>
          ) : (
            <Button onClick={onLogin} className="gold-btn gold-shine">
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Button>
          )}
        </div>
      </nav>
    </header>
  );
}
