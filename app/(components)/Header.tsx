"use client";

import Link from "next/link";
import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { CategoryNav } from "./CategoryNav";

type CategoryKey = "ALL" | "POLITICS" | "SPORTS" | "CRYPTO" | "SOCIAL" | "DATA";

interface HeaderProps {
  selectedCategory: CategoryKey;
  onCategoryChange: (category: CategoryKey) => void;
}

export function Header({ selectedCategory, onCategoryChange }: HeaderProps) {
  const { data: session, status } = useSession()
  const router = useRouter()

  const displayName = session && (session.user as any)?.username 
    ? `@${(session.user as any).username}` 
    : session?.user?.name || ""

  return (
    <header className="bg-[#FAFAF6] border-b border-[#E5E5E5] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-6 py-4">
        {/* Top Row: Logo, Title, Login */}
        <div className="flex items-center justify-between h-16 relative">
          {/* Logo - 200px left of center */}
          <div className="flex items-center -ml-[200px] mt-[25px]">
            <a href="/" className="flex items-center">
              <img
                src="/Site Logo.svg"
                alt="The Prediction Market Logo"
                className="h-20 w-auto"
              />
            </a>
          </div>

          {/* Title and Subheading - Centered */}
          <div className="absolute left-1/2 transform -translate-x-1/2 text-center pointer-events-none z-0">
            <h1 className="text-3xl font-light tracking-[0.2em] uppercase text-black">
              THE PREDICTION MARKET
            </h1>
            <p className="text-sm text-gray-600 mt-1 font-light uppercase">
              YOUR HOME FOR EVERYTHING PREDICTION MARKETS
            </p>
          </div>

          {/* Login Button - 200px right of center */}
          <div className="flex items-center -mr-[200px]">
            {status === "loading" ? (
              <div className="px-6 py-2 text-sm text-gray-500">Loading...</div>
            ) : session ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => router.push("/profile")}
                  className="text-sm text-gray-700 hover:text-black transition-colors cursor-pointer"
                  title="Click to edit profile"
                >
                  {displayName}
                </button>
                <button
                  onClick={() => signOut()}
                  className="px-6 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
                >
                  LOGOUT
                </button>
              </div>
            ) : (
              <button
                onClick={() => signIn()}
                className="px-6 py-2 bg-black text-white rounded-full text-sm font-medium hover:bg-gray-800 transition-colors"
              >
                LOGIN
              </button>
            )}
          </div>
        </div>

        {/* Category Navigation */}
        <nav className="flex items-center justify-center gap-6 mt-6 relative z-10">
          <Link
            href="/"
            className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === "ALL"
                ? "bg-black text-white"
                : "text-gray-700 hover:text-black"
            }`}
          >
            ALL
          </Link>
          <Link
            href="/?category=politics"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedCategory === "POLITICS"
                ? "bg-black text-white"
                : "text-gray-700 hover:text-black"
            }`}
          >
            🗳️ POLITICS
          </Link>
          <Link
            href="/?category=sports"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedCategory === "SPORTS"
                ? "bg-black text-white"
                : "text-gray-700 hover:text-black"
            }`}
          >
            🏀 SPORTS
          </Link>
          <Link
            href="/?category=crypto"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedCategory === "CRYPTO"
                ? "bg-black text-white"
                : "text-gray-700 hover:text-black"
            }`}
          >
            ₿ CRYPTO
          </Link>
          <Link
            href="/?category=social"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedCategory === "SOCIAL"
                ? "bg-black text-white"
                : "text-gray-700 hover:text-black"
            }`}
          >
            💬 SOCIAL
          </Link>
          <Link
            href="/data"
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex items-center gap-2 ${
              selectedCategory === "DATA"
                ? "bg-black text-white"
                : "text-gray-700 hover:text-black"
            }`}
          >
            📊 DATA
          </Link>
        </nav>
      </div>
    </header>
  );
}

