"use client";
import React from "react";
import Link from "next/link";

const Footer = ({ children }) => {
  return (
    <footer className="w-full bg-white border-t border-gray-200 text-center py-6 mt-12 shadow-sm backdrop-blur-md">
      <div className="text-gray-600 text-sm mb-3">
        {children || "© 2025 VoiceFlow AI. All rights reserved."}
      </div>

      <div className="flex justify-center gap-6">
        <Link
          href="/"
          className="text-gray-700 hover:text-blue-600 text-sm font-medium transition-colors duration-300"
        >
          Home
        </Link>
        <Link
          href="/"
          className="text-gray-700 hover:text-blue-600 text-sm font-medium transition-colors duration-300"
        >
          Privacy
        </Link>
        <Link
          href="/"
          className="text-gray-700 hover:text-blue-600 text-sm font-medium transition-colors duration-300"
        >
          Terms
        </Link>
      </div>
    </footer>
  );
};

export default Footer;
