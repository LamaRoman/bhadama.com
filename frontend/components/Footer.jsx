"use client";

export default function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Flex container for columns */}
        <div className="flex flex-col md:flex-row md:justify-between gap-10">
          {/* Column 1: Logo + About */}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white">Bhadama.com</h2>
            <p className="mt-3 text-sm">
              Nepal’s trusted booking platform for rooms, apartments, houses,
              and short-term stays. Simple. Safe. Fast.
            </p>
          </div>

          {/* Column 2: Quick Links */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-3">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/listings" className="hover:text-white">Find Listings</a></li>
              <li><a href="/login" className="hover:text-white">Login</a></li>
              <li><a href="/register" className="hover:text-white">Create Account</a></li>
              <li><a href="/contact" className="hover:text-white">Contact Us</a></li>
            </ul>
          </div>

          {/* Column 3: For Owners */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-3">For Owners</h3>
            <ul className="space-y-2 text-sm">
              <li><a href="/dashboard" className="hover:text-white">Owner Dashboard</a></li>
              <li><a href="/list-property" className="hover:text-white">List Your Property</a></li>
              <li><a href="/pricing" className="hover:text-white">Pricing</a></li>
              <li><a href="/help" className="hover:text-white">Help Center</a></li>
            </ul>
          </div>

          {/* Column 4: Contact */}
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-3">Contact</h3>
            <ul className="text-sm space-y-2">
              <li>Email: support@bhadama.com</li>
              <li>Phone: +977-98xxxxxxxx</li>
              <li>Location: Kathmandu, Nepal</li>
            </ul>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="border-t border-gray-700 mt-10 pt-6 flex flex-col md:flex-row justify-between text-sm text-gray-400">
          <p>© {new Date().getFullYear()} Bhadama.com • All Rights Reserved</p>
          <div className="flex space-x-6 mt-3 md:mt-0">
            <a href="/terms" className="hover:text-white">Terms</a>
            <a href="/privacy" className="hover:text-white">Privacy</a>
            <a href="/cookies" className="hover:text-white">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
