"use client";

import StarRating from "./StarRating";

export default function HostCard({ host }) {
  return (
    <div className="bg-white rounded-2xl p-6 shadow-lg">
      <div className="flex items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
          {host?.profilePhoto ? (
            <img
              src={host.profilePhoto}
              alt={host.name}
              className="w-full h-full object-cover rounded-full"
            />
          ) : (
            <span className="text-white font-black text-2xl">
              {host?.name?.charAt(0) || "H"}
            </span>
          )}
        </div>
        <div className="flex-1">
          <p className="text-sm text-stone-500 font-medium">Hosted by</p>
          <p className="text-xl font-bold text-stone-900 mb-1">
            {host?.name || "Host"}
          </p>
          <div className="flex items-center gap-2">
            <StarRating rating={4.9} size="sm" />
            <span className="text-sm text-stone-600">4.9 • Superhost</span>
          </div>
        </div>
        <button className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors">
          Contact Host
        </button>
      </div>
    </div>
  );
}