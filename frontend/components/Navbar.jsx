"use client";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "../hooks/useAuth.js";

export default function Navbar() {
  const { user, logout } = useAuth();

  return (
    <nav className="shadow" style={{ backgroundColor: "#f9f9f9" }}>
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">

        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2">
          <Image
            src="/images/bhadama.png"
            alt="Bhadama Logo"
            width={70}
            height={80}
            className="rounded"
          />
          <span className="text-2xl font-bold text-gray-800 hover:text-gray-600 transition">
            Bhadama.com
          </span>
        </Link>

        {/* Menu */}
        <div className="flex items-center space-x-4">
          {!user && (
            <>
              <Link
                href="/auth/login"
                className="px-4 py-2 bg-white text-gray-800 font-semibold rounded hover:bg-gray-100 transition"
              >
                Login
              </Link>
              <Link
                href="/auth/register"
                className="px-4 py-2 bg-blue-600 text-white font-semibold rounded hover:bg-blue-700 transition"
              >
                Register
              </Link>
            </>
          )}

          {user && (
            <>
              <span className="font-medium text-gray-800">{user.name}</span>
              <button
                onClick={logout}
                className="px-4 py-2 bg-red-500 text-white font-semibold rounded hover:bg-red-600 transition"
              >
                Logout
              </button>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
