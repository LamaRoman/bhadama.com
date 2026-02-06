// app/host/dashboard/components/StoryBanner.jsx
"use client";

import { BookOpen, ArrowRight, X, AlertCircle, Clock, FileText } from "lucide-react";

/**
 * Banner that reminds hosts to create/complete their story
 * Shows different messages based on story status
 * Can be dismissed for the session
 */
export default function StoryBanner({ story, onNavigateToStory, onDismiss }) {
  // Determine what to show based on story status
  const status = story?.status;
  
  // Don't show banner if story is PENDING or PUBLISHED
  if (status === "PENDING" || status === "PUBLISHED") {
    return null;
  }

  // Configure banner based on status
  let config;
  
  if (!story) {
    // No story exists
    config = {
      icon: BookOpen,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
      borderColor: "border-amber-200",
      bgColor: "bg-gradient-to-r from-amber-50 to-orange-50",
      title: "Share your story with guests!",
      description: "Help guests connect with you personally. Hosts with stories get more bookings.",
      buttonText: "Create Your Story",
      buttonStyle: "bg-amber-500 hover:bg-amber-600 text-white",
    };
  } else if (status === "DRAFT") {
    // Story saved as draft
    config = {
      icon: FileText,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
      borderColor: "border-blue-200",
      bgColor: "bg-gradient-to-r from-blue-50 to-cyan-50",
      title: "Your story is saved as draft",
      description: "Submit it for review to make it visible to guests.",
      buttonText: "Complete Your Story",
      buttonStyle: "bg-blue-500 hover:bg-blue-600 text-white",
    };
  } else if (status === "REJECTED") {
    // Story was rejected
    config = {
      icon: AlertCircle,
      iconBg: "bg-red-100",
      iconColor: "text-red-600",
      borderColor: "border-red-200",
      bgColor: "bg-gradient-to-r from-red-50 to-orange-50",
      title: "Your story needs revision",
      description: story.rejectionReason || "Please review and update your story based on the feedback.",
      buttonText: "Update Your Story",
      buttonStyle: "bg-red-500 hover:bg-red-600 text-white",
    };
  } else {
    // Unknown status, don't show
    return null;
  }

  const Icon = config.icon;

  return (
    <div className={`relative rounded-xl border ${config.borderColor} ${config.bgColor} p-4 mb-6 shadow-sm`}>
      <div className="flex items-start gap-4">
        {/* Icon */}
        <div className={`flex-shrink-0 p-2.5 rounded-lg ${config.iconBg}`}>
          <Icon className={`w-5 h-5 ${config.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{config.title}</h3>
          <p className="text-sm text-gray-600 mt-0.5 line-clamp-2">{config.description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onNavigateToStory}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${config.buttonStyle}`}
          >
            {config.buttonText}
            <ArrowRight className="w-4 h-4" />
          </button>
          
          <button
            onClick={onDismiss}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white/50 rounded-lg transition-colors"
            title="Dismiss for now"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}