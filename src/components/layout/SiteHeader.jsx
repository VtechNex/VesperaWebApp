import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, LogOut } from "lucide-react";
import { Button } from "../ui/button";
import { BRAND } from "../../mock/mock";
import { useAuth } from "../../context/AuthContext";

export default function SiteHeader({ onLogin, theme = "dark", showPublicLogin = false }) {
  const navigate = useNavigate();
  const { isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const isLight = theme === "light";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={`sticky top-0 inset-x-0 z-50 transition-colors ${
        scrolled
          ? isLight
            ? "bg-[rgba(246,241,231,0.92)] backdrop-blur-md border-b border-black/10"
            : "bg-black/70 backdrop-blur-md border-b border-white/10"
          : "bg-transparent"
      }`}
    >
      <nav className="w-full px-4 md:px-6 py-4 grid grid-cols-[auto_1fr_auto] items-center">
        <a
          href="/#home"
          className={`text-[15px] tracking-[0.25em] font-semibold transition-colors ${
            isLight ? "text-slate-900 hover:text-[#8C6A15]" : "brand-link text-white"
          }`}
        >
          {BRAND.name}
        </a>

        <div className={`hidden md:flex justify-center items-center gap-8 text-sm ${isLight ? "text-slate-700" : ""}`}>
          <a href="/#home" className={isLight ? "hover:text-slate-900 transition-colors" : "nav-link"}>Home</a>
          <a href="/#about" className={isLight ? "hover:text-slate-900 transition-colors" : "nav-link"}>About</a>
          <a href="/#services" className={isLight ? "hover:text-slate-900 transition-colors" : "nav-link"}>Services</a>
          <a href="/#properties" className={isLight ? "hover:text-slate-900 transition-colors" : "nav-link"}>Properties</a>
          <a href="/#work" className={isLight ? "hover:text-slate-900 transition-colors" : "nav-link"}>Work With Us</a>
        </div>

        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <>
              <Button onClick={() => navigate("/dashboard/admin")} className="gold-btn gold-shine">
                <LogIn className="h-4 w-4 mr-2" />
                Dashboard
              </Button>
              <Button
                onClick={() => {
                  logout();
                  navigate("/", { replace: true });
                }}
                variant="ghost"
                className={isLight ? "text-red-500 hover:text-red-600" : "text-red-400 hover:text-red-300"}
              >
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </>
          ) : showPublicLogin ? (
            <Button onClick={onLogin} className="gold-btn gold-shine">
              <LogIn className="h-4 w-4 mr-2" />
              Login
            </Button>
          ) : null
          }
        </div>
      </nav>
    </header>
  );
}
