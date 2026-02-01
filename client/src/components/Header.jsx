"use client";

import React, { useState } from "react";
import Link from "next/link";
import { SignedIn, SignedOut, UserButton, useClerk } from "@clerk/nextjs";

const Header = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { signOut } = useClerk();

  const toggleMenu = () => setIsOpen((prev) => !prev);
  const closeMenu = () => setIsOpen(false);

  return (
    <header className="fixed top-0 z-50 w-full">
      {/* Modern minimal glass background */}
      <div className="backdrop-blur-xl bg-white/70 border-b border-slate-200/60 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-4 px-6 py-4 max-w-7xl mx-auto">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group" onClick={closeMenu}>
            <div className="relative flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-xl shadow-lg shadow-indigo-500/30 group-hover:scale-105 transition-transform duration-300">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>

            <span className="text-xl font-bold text-slate-900 tracking-tight ml-1">
              VoiceFlow
            </span>
          </Link>

          {/* Right Section */}
          <div className="ml-auto flex items-center gap-4 relative">
            {/* Mobile menu button */}
            <button
              className="sm:hidden text-slate-600 focus:outline-none"
              onClick={toggleMenu}
              aria-label="Toggle navigation menu"
            >
              <svg
                className="w-6 h-6 transition-transform duration-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d={
                    isOpen
                      ? "M6 18L18 6M6 6l12 12"
                      : "M4 6h16M4 12h16M4 18h16"
                  }
                />
              </svg>
            </button>

            {/* Navigation */}
            <nav
              className={`absolute sm:static top-full right-0 w-[min(18rem,calc(100vw-2rem))] sm:w-auto flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6
              bg-white text-slate-600 sm:bg-transparent sm:text-slate-600 border border-slate-100 sm:border-none rounded-2xl sm:rounded-none shadow-2xl sm:shadow-none
              transition-all duration-300 origin-top-right p-4 sm:p-0 ${isOpen ? "opacity-100 visible scale-100" : "opacity-0 invisible scale-95 sm:opacity-100 sm:visible sm:scale-100"}`}
            >
              {["voice_agent", "voice_lab"].map((route) => (
                <Link
                  key={route}
                  href={`/${route}`}
                  onClick={closeMenu}
                  className="px-4 py-2 rounded-lg hover:bg-slate-100 text-sm font-semibold hover:text-indigo-600 transition-colors"
                >
                  {route === "voice_agent" ? "Voice Agent" : "Voice Lab"}
                </Link>
              ))}

              <SignedOut>
                <Link
                  href="/sign-in"
                  onClick={closeMenu}
                  className="sm:hidden w-full px-4 py-2 rounded-lg hover:bg-slate-100 text-left text-sm font-semibold hover:text-indigo-600 transition-colors"
                >
                  Sign in
                </Link>
              </SignedOut>

              <SignedIn>
                <div className="sm:hidden w-full">
                  <button
                    onClick={() => signOut({ redirectUrl: "/" })}
                    className="w-full px-4 py-2 rounded-lg hover:bg-slate-100 text-left text-sm font-semibold hover:text-indigo-600 transition-colors"
                  >
                    Sign out
                  </button>
                </div>
              </SignedIn>
            </nav>



            {/* DESKTOP AUTH */}
            <div className="hidden sm:flex items-center gap-4">
              <SignedOut>
                <Link
                  href="/sign-in"
                  className="px-5 py-2.5 rounded-full bg-slate-900 text-white font-semibold text-sm hover:bg-slate-800 transition shadow-md hover:shadow-lg"
                >
                  Sign in
                </Link>
              </SignedOut>

              <SignedIn>
                <button
                  onClick={() => signOut({ redirectUrl: "/" })}
                  className="text-slate-600 font-medium text-sm hover:text-indigo-600 transition"
                >
                  Sign out
                </button>
                <UserButton
                  appearance={{
                    elements: {
                      avatarBox: "h-9 w-9 ring-2 ring-indigo-100 hover:ring-indigo-300 transition",
                    },
                  }}
                  afterSignOutUrl="/"
                />
              </SignedIn>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
