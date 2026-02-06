// components/filters/OfferFilterPills.jsx
"use client";

import { Gift, TrendingUp, Sparkles, Tag, X } from "lucide-react";
import { OFFER_FILTER_TYPES } from "../../hooks/useListingFilters";

const FILTER_OPTIONS = [
  {
    id: "none",
    label: "All Venues",
    icon: null,
    color: "stone",
    activeColor: "bg-stone-600",
  },
  {
    id: OFFER_FILTER_TYPES.ALL,
    label: "Special Offers",
    icon: Sparkles,
    color: "purple",
    activeColor: "bg-gradient-to-r from-purple-500 to-indigo-500",
  },
  {
    id: OFFER_FILTER_TYPES.TIERED,
    label: "Tiered Deals",
    icon: TrendingUp,
    color: "indigo",
    activeColor: "bg-gradient-to-r from-indigo-500 to-violet-500",
  },
  {
    id: OFFER_FILTER_TYPES.BONUS,
    label: "Bonus Hours",
    icon: Gift,
    color: "emerald",
    activeColor: "bg-gradient-to-r from-emerald-500 to-teal-500",
  },
  {
    id: OFFER_FILTER_TYPES.ON_SALE,
    label: "On Sale",
    icon: Tag,
    color: "red",
    activeColor: "bg-gradient-to-r from-red-500 to-rose-500",
  },
];

export default function OfferFilterPills({
  activeFilter = "none",
  onFilterChange,
  counts = {},
  showCounts = true,
  showAllVenues = true,
  size = "default", // "default" | "small"
  className = "",
}) {
  const sizeClasses = {
    default: "px-3 py-2 text-sm",
    small: "px-2.5 py-1.5 text-xs",
  };

  const iconSizes = {
    default: "w-4 h-4",
    small: "w-3.5 h-3.5",
  };

  const handleClick = (filterId) => {
    if (onFilterChange) {
      onFilterChange(filterId === activeFilter ? "none" : filterId);
    }
  };

  // Filter out options with 0 count (except "none" and currently active)
  const visibleOptions = FILTER_OPTIONS.filter((option) => {
    if (option.id === "none") return showAllVenues;
    if (option.id === activeFilter) return true;
    
    const count = getCount(option.id, counts);
    return count > 0;
  });

  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {visibleOptions.map((option) => {
        const isActive = activeFilter === option.id;
        const count = getCount(option.id, counts);
        const IconComponent = option.icon;

        return (
          <button
            key={option.id}
            onClick={() => handleClick(option.id)}
            className={`
              inline-flex items-center gap-1.5 rounded-full font-medium
              transition-all duration-200 border
              ${sizeClasses[size]}
              ${isActive
                ? `${option.activeColor} text-white border-transparent shadow-md`
                : `bg-white text-stone-700 border-stone-200 hover:border-${option.color}-300 hover:bg-${option.color}-50`
              }
            `}
          >
            {IconComponent && (
              <IconComponent className={iconSizes[size]} />
            )}
            {option.label}
            {showCounts && count > 0 && option.id !== "none" && (
              <span
                className={`
                  px-1.5 py-0.5 text-xs rounded-full
                  ${isActive
                    ? "bg-white/20"
                    : `bg-${option.color}-100 text-${option.color}-700`
                  }
                `}
              >
                {count}
              </span>
            )}
            {isActive && option.id !== "none" && (
              <X className={`${iconSizes[size]} ml-0.5 opacity-70`} />
            )}
          </button>
        );
      })}
    </div>
  );
}

// Helper to get count for a filter type
function getCount(filterId, counts) {
  switch (filterId) {
    case OFFER_FILTER_TYPES.ALL:
      return counts.all || 0;
    case OFFER_FILTER_TYPES.TIERED:
      return counts.tiered || 0;
    case OFFER_FILTER_TYPES.BONUS:
      return counts.bonus || 0;
    case OFFER_FILTER_TYPES.ON_SALE:
      return counts.sale || 0;
    default:
      return 0;
  }
}

// Compact version for use in headers/toolbars
export function OfferFilterPillsCompact({
  activeFilter = "none",
  onFilterChange,
  counts = {},
}) {
  return (
    <OfferFilterPills
      activeFilter={activeFilter}
      onFilterChange={onFilterChange}
      counts={counts}
      showCounts={false}
      showAllVenues={false}
      size="small"
    />
  );
}

// Checkbox version for sidebar
export function OfferFilterCheckboxes({
  activeFilters = [],
  onFilterChange,
  counts = {},
}) {
  const handleToggle = (filterId) => {
    if (onFilterChange) {
      if (activeFilters.includes(filterId)) {
        onFilterChange(activeFilters.filter((f) => f !== filterId));
      } else {
        onFilterChange([...activeFilters, filterId]);
      }
    }
  };

  // Only show filter options that have results
  const checkboxOptions = FILTER_OPTIONS.filter(
    (opt) => opt.id !== "none" && getCount(opt.id, counts) > 0
  );

  if (checkboxOptions.length === 0) return null;

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-stone-700 mb-2">
        Special Offers
      </label>
      {checkboxOptions.map((option) => {
        const isChecked = activeFilters.includes(option.id);
        const count = getCount(option.id, counts);
        const IconComponent = option.icon;

        return (
          <label
            key={option.id}
            className={`
              flex items-center gap-3 p-2 rounded-lg cursor-pointer
              transition-colors
              ${isChecked ? `bg-${option.color}-50` : "hover:bg-stone-50"}
            `}
          >
            <input
              type="checkbox"
              checked={isChecked}
              onChange={() => handleToggle(option.id)}
              className={`
                w-4 h-4 rounded border-stone-300
                text-${option.color}-600 focus:ring-${option.color}-500
              `}
            />
            {IconComponent && (
              <IconComponent className={`w-4 h-4 text-${option.color}-600`} />
            )}
            <span className="flex-1 text-sm text-stone-700">{option.label}</span>
            <span className="text-xs text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-full">
              {count}
            </span>
          </label>
        );
      })}
    </div>
  );
}