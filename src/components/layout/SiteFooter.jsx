import React from 'react'
import { BRAND } from '../../mock/mock'

export default function SiteFooter() {
  return (
    <footer className="bg-black border-t border-white/10">
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-10 grid md:grid-cols-3 gap-8 text-sm">

        {/* Left Section */}
        <div>
          <div className="text-[13px] tracking-[0.25em] text-white">
            {BRAND.name}
          </div>
          <p className="mt-3 text-white/60 max-w-sm">
            Premium, transparent real estate services for Pune's discerning buyers and sellers.
          </p>
        </div>

        {/* Center Section */}
        <div className="flex flex-col">
          <div className="grid grid-cols-2 gap-2 text-white/80 w-full text-left">
            <a href="#home" className="footer-link">Home</a>
            <a href="#about" className="footer-link">About</a>
            <a href="#services" className="footer-link">Services</a>
            <a href="#properties" className="footer-link">Properties</a>
            <a href="#work" className="footer-link">Work With Us</a>
          </div>

          {/* Credit centered */}
          <p className="text-white/60 mt-6 w-full text-center">
            Developed by{" "}
            <a
              href="https://www.vtechnex.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              VTechNex
            </a>
          </p>
        </div>

        {/* Right Section */}
        <div className="text-white/60">
          © {new Date().getFullYear()} Vespera Estates. All rights reserved.
        </div>

      </div>
    </footer>
  )
}
