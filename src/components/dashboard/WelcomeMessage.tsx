"use client";
import React from "react";

const WelcomeMessage = () => {
  return (
    <div className="w-full p-8 rounded-2xl bg-gradient-to-br from-orange-400 to-pink-500 text-white shadow-xl flex flex-col items-start text-left">
      <div className="flex items-center gap-3">
        <h1 className="text-4xl font-extrabold tracking-tight">
          Welcome to PantryVeda
        </h1>
        <span className="text-4xl">👋</span>
      </div>

      <p className="mt-3 text-white/90 text-lg leading-relaxed max-w-xl">
        Reduce waste, save money, and always know what’s in your kitchen.
      </p>
    </div>
  );
};

export default WelcomeMessage;
