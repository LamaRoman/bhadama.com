"use client";
import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation"; // ✅ ADDED
import { useAuth } from "./../contexts/AuthContext";
import NotificationBell from "./NotificationBell";

export default function Navbar() {
  const { user, logout } = useAuth();
  const router = useRouter(); // ✅ ADDED
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ✅ ADDED - Handle logout with redirect
  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await logout();
    router.push('/'); // Redirect to homepage
  };

  return (
    <nav className="sticky top-0 z-60 bg-white/90 backdrop-blur-lg border-b border-gray-100/80 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
         {/* Logo Section */}
        <Link href="/" className="flex items-center group">
          <div className="relative">
            {/* Warm Sunset Logo */}
            <svg width="200" height="50" viewBox="0 0 200 50" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-10 w-auto transition-transform duration-200 group-hover:scale-105">
              <text x="0" y="32" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="400" fill="#6B7280">my</text>
              <text x="38" y="32" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="700" fill="#F97316">Big</text>
              <text x="85" y="32" fontFamily="Arial, sans-serif" fontSize="28" fontWeight="700" fill="#16A34A">Yard</text>
              <text x="152" y="32" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="300" fill="#9CA3AF">.com</text>
            </svg>
          </div>
        </Link>

        {/* Right Menu */}
        <div className="flex items-center gap-3">
          {/* Blog Link - Simple white/grey styling */}
          <Link
            href="/blogs"
            className="flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors duration-200"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z" />
            </svg>
            Blog
          </Link>

          {!user ? (
            <>
              
              <Link
                href="/auth/login"
                className="px-4 py-2 text-sm font-medium text-gray-600 hover:text-gray-900 rounded-full hover:bg-gray-50 transition-all duration-200"
              >
                Sign In
              </Link>
              <Link
                href="/auth/register/user"
                className="px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-emerald-600 to-lime-500 text-white rounded-full hover:shadow-lg hover:shadow-emerald-200 transition-all duration-300 hover:scale-105 active:scale-95"
              >
                Sign Up
              </Link>
            </>
          ) : (
            <div className="relative flex items-center gap-4" ref={dropdownRef}>
              {/* Quick Action Links - Simple white/grey styling for HOST users */}
              {user.role === "HOST" && (
                <Link
                  href="/host/listings/new"
                  className="hidden md:flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 rounded-lg border border-gray-200 transition-colors duration-200"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  List Space
                </Link>
              )}
    <NotificationBell/>

              {/* User Menu */}
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center gap-3 group relative"
              >
                <div className="hidden sm:flex flex-col items-end">
                  <span className="text-sm font-semibold text-gray-800 group-hover:text-gray-700 transition-colors">
                    {user.name || "User"}
                  </span>
                  <span className="text-xs text-gray-500">
                    {user.role?.toLowerCase() === "host" ? "🏠 Host" : "👤 Guest"}
                  </span>
                </div>
                
                <div className="relative">
                  <div className="w-10 h-10 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-md">
                    {user.name?.charAt(0).toUpperCase() || "U"}
                  </div>
                  <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${user.role === "HOST" ? 'bg-gray-500' : user.role === "ADMIN" ? 'bg-gray-700' : 'bg-gray-400'}`}></div>
                </div>
                
                <svg 
                  className={`w-5 h-5 text-gray-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full mt-3 w-72 bg-white rounded-2xl shadow-xl border border-gray-200 overflow-hidden z-50 animate-fadeIn">
                  {/* Header with Avatar */}
                  <div className="p-5 bg-gray-50 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-gray-600 rounded-full flex items-center justify-center text-white font-bold text-xl shadow-md">
                        {user.name?.charAt(0).toUpperCase() || "U"}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{user.name}</p>
                        <p className="text-sm text-gray-600 truncate">{user.email}</p>
                        <span className="inline-block mt-1 px-2 py-0.5 bg-white text-xs font-medium text-gray-700 rounded-full border border-gray-200">
                          {user.role?.toLowerCase() === "admin" ? "Administrator" : 
                           user.role?.toLowerCase() === "host" ? "Space Host" : "Verified Guest"}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Menu Items */}
                  <div className="p-2">
                    {/* Guest Navigation */}
                    <div className="mb-2">
                      <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Explore</p>
                      <Link
                        href="/"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Browse Spaces</p>
                          <p className="text-xs text-gray-500">Find your perfect venue</p>
                        </div>
                      </Link>
                      
                      <Link
                        href="/users/dashboard"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">My Bookings</p>
                          <p className="text-xs text-gray-500">View & manage reservations</p>
                        </div>
                      </Link>
                    </div>

                    {/* Host Navigation (if applicable) */}
                    {user.role === "HOST" && (
                      <div className="mb-2 border-t border-gray-100 pt-2">
                        <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Host Tools</p>
                        <Link
                          href="/host/dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">Host Dashboard</p>
                            <p className="text-xs text-gray-500">Manage your listings</p>
                          </div>
                        </Link>
                        
                        <Link
                          href="/host/listings/new"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">Add New Listing</p>
                            <p className="text-xs text-gray-500">Earn extra income</p>
                          </div>
                        </Link>
                      </div>
                    )}

                    {/* Admin Navigation (if applicable) */}
                    {user.role === "ADMIN" && (
                      <div className="mb-2 border-t border-gray-100 pt-2">
                        <p className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider">Administration</p>
                        <Link
                          href="/admin/dashboard"
                          onClick={() => setIsDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all group"
                        >
                          <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                          </div>
                          <div>
                            <p className="font-medium">Admin Dashboard</p>
                            <p className="text-xs text-gray-500">Manage platform</p>
                          </div>
                        </Link>
                      </div>
                    )}

                    {/* Settings & Logout */}
                    <div className="border-t border-gray-100 pt-2">
                      <Link
                        href="/users/profile"
                        onClick={() => setIsDropdownOpen(false)}
                        className="flex items-center gap-3 px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all group"
                      >
                        <div className="w-9 h-9 rounded-lg bg-gray-50 flex items-center justify-center group-hover:bg-gray-100 transition-colors">
                          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                        </div>
                        <div>
                          <p className="font-medium">Account Settings</p>
                          <p className="text-xs text-gray-500">Update profile & preferences</p>
                        </div>
                      </Link>
                      
                      {/* ✅ UPDATED - Use handleLogout instead of direct logout() */}
                      <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-gray-700 hover:bg-gray-50 transition-all group mt-1"
                      >
                        <div className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                          <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                          </svg>
                        </div>
                        <div className="text-left">
                          <p className="font-medium">Sign Out</p>
                          <p className="text-xs text-gray-500">End your session</p>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}