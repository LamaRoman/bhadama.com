"use client";

import { useMemo, useState, useEffect } from "react";
import { 
  CheckCircle, XCircle, AlertCircle, 
  TrendingUp
} from "lucide-react";

/**
 * Calculate SEO score based on blog data
 */
const calculateSeoDetails = (blog) => {
  const checks = [];
  let score = 0;

  if (!blog) return { score: 0, checks: [] };

  // ==================== TITLE CHECKS (20 points) ====================
  if (blog.title) {
    if (blog.title.length >= 10) {
      checks.push({ id: "title-exists", label: "Title is present", passed: true, points: 10 });
      score += 10;
    }
    
    if (blog.title.length >= 50 && blog.title.length <= 60) {
      checks.push({ id: "title-length", label: "Title length is optimal (50-60 chars)", passed: true, points: 5, detail: `${blog.title.length} chars` });
      score += 5;
    } else {
      checks.push({ id: "title-length", label: "Title length should be 50-60 chars", passed: false, points: 0, detail: `${blog.title.length} chars` });
    }
    
    if (blog.focusKeyword && blog.title.toLowerCase().includes(blog.focusKeyword.toLowerCase())) {
      checks.push({ id: "title-keyword", label: "Focus keyword in title", passed: true, points: 5 });
      score += 5;
    } else if (blog.focusKeyword) {
      checks.push({ id: "title-keyword", label: "Add focus keyword to title", passed: false, points: 0 });
    }
  } else {
    checks.push({ id: "title-exists", label: "Add a title", passed: false, points: 0 });
  }

  // ==================== META DESCRIPTION (15 points) ====================
  if (blog.metaDescription) {
    checks.push({ id: "meta-exists", label: "Meta description present", passed: true, points: 5 });
    score += 5;
    
    if (blog.metaDescription.length >= 150 && blog.metaDescription.length <= 160) {
      checks.push({ id: "meta-length", label: "Meta description optimal (150-160)", passed: true, points: 5, detail: `${blog.metaDescription.length} chars` });
      score += 5;
    } else {
      checks.push({ id: "meta-length", label: "Meta description: 150-160 chars", passed: false, points: 0, detail: `${blog.metaDescription.length} chars` });
    }
    
    if (blog.focusKeyword && blog.metaDescription.toLowerCase().includes(blog.focusKeyword.toLowerCase())) {
      checks.push({ id: "meta-keyword", label: "Focus keyword in meta", passed: true, points: 5 });
      score += 5;
    } else if (blog.focusKeyword) {
      checks.push({ id: "meta-keyword", label: "Add keyword to meta description", passed: false, points: 0 });
    }
  } else {
    checks.push({ id: "meta-exists", label: "Add meta description", passed: false, points: 0 });
  }

  // ==================== CONTENT CHECKS (30 points) ====================
  const wordCount = blog.wordCount || 0;
  
  if (wordCount >= 500) {
    checks.push({ id: "word-count-min", label: "Min word count (500+)", passed: true, points: 10, detail: `${wordCount} words` });
    score += 10;
  } else {
    checks.push({ id: "word-count-min", label: `Need ${500 - wordCount} more words`, passed: false, points: 0, detail: `${wordCount}/500` });
  }
  
  if (wordCount >= 800) {
    checks.push({ id: "word-count-good", label: "Good length (800+)", passed: true, points: 5 });
    score += 5;
  } else if (wordCount >= 500) {
    checks.push({ id: "word-count-good", label: "Consider 800+ words", passed: false, points: 0, warning: true });
  }
  
  if (wordCount >= 1500) {
    checks.push({ id: "word-count-excellent", label: "Excellent length (1500+)", passed: true, points: 5 });
    score += 5;
  }

  // Content structure checks
  if (blog.content) {
    if (blog.content.includes("<h2")) {
      checks.push({ id: "has-h2", label: "Has H2 headings", passed: true, points: 5 });
      score += 5;
    } else {
      checks.push({ id: "has-h2", label: "Add H2 headings", passed: false, points: 0 });
    }
    
    if (blog.content.includes("<h3")) {
      checks.push({ id: "has-h3", label: "Has H3 subheadings", passed: true, points: 3 });
      score += 3;
    } else {
      checks.push({ id: "has-h3", label: "Add H3 subheadings", passed: false, points: 0, warning: true });
    }
    
    if (blog.content.includes("<img")) {
      checks.push({ id: "has-images", label: "Has images in content", passed: true, points: 5 });
      score += 5;
    } else {
      checks.push({ id: "has-images", label: "Add images to content", passed: false, points: 0, warning: true });
    }
    
    if (blog.content.includes("<a ")) {
      checks.push({ id: "has-links", label: "Contains links", passed: true, points: 2 });
      score += 2;
    } else {
      checks.push({ id: "has-links", label: "Add internal/external links", passed: false, points: 0, warning: true });
    }
    
    // Check for focus keyword in content
    if (blog.focusKeyword && blog.content.toLowerCase().includes(blog.focusKeyword.toLowerCase())) {
      checks.push({ id: "content-keyword", label: "Focus keyword in content", passed: true, points: 5 });
      score += 5;
    } else if (blog.focusKeyword) {
      checks.push({ id: "content-keyword", label: "Add focus keyword to content", passed: false, points: 0 });
    }
  }

  // ==================== MEDIA CHECKS (15 points) ====================
  if (blog.coverImage) {
    checks.push({ id: "cover-image", label: "Cover image set", passed: true, points: 10 });
    score += 10;
  } else {
    checks.push({ id: "cover-image", label: "Add cover image", passed: false, points: 0 });
  }
  
  if (blog.coverImageAlt) {
    checks.push({ id: "cover-alt", label: "Cover image has alt text", passed: true, points: 5 });
    score += 5;
  } else if (blog.coverImage) {
    checks.push({ id: "cover-alt", label: "Add alt text to cover", passed: false, points: 0 });
  }

  // ==================== STRUCTURE CHECKS (15 points) ====================
  if (blog.category && blog.category !== "GENERAL") {
    checks.push({ id: "has-category", label: "Specific category selected", passed: true, points: 5 });
    score += 5;
  } else {
    checks.push({ id: "has-category", label: "Select a specific category", passed: false, points: 0 });
  }
  
  if (blog.tags && blog.tags.length >= 2) {
    checks.push({ id: "has-tags", label: `Has ${blog.tags.length} tags (min 2)`, passed: true, points: 5 });
    score += 5;
  } else {
    const needed = 2 - (blog.tags?.length || 0);
    checks.push({ id: "has-tags", label: `Add ${needed} more tag${needed > 1 ? 's' : ''}`, passed: false, points: 0 });
  }
  
  if (blog.excerpt && blog.excerpt.length >= 100) {
    checks.push({ id: "has-excerpt", label: "Custom excerpt set", passed: true, points: 5 });
    score += 5;
  } else {
    checks.push({ id: "has-excerpt", label: "Add custom excerpt (100+ chars)", passed: false, points: 0, warning: true });
  }

  // ==================== FOCUS KEYWORD (5 points) ====================
  if (blog.focusKeyword && blog.focusKeyword.length >= 3) {
    checks.push({ id: "has-focus-keyword", label: "Focus keyword set", passed: true, points: 5 });
    score += 5;
  } else {
    checks.push({ id: "has-focus-keyword", label: "Set a focus keyword", passed: false, points: 0, warning: true });
  }

  return { score: Math.min(score, 100), checks };
};

const getScoreColor = (score) => {
  if (score >= 80) return "text-green-600";
  if (score >= 60) return "text-yellow-600";
  return "text-red-600";
};

const getScoreBgColor = (score) => {
  if (score >= 80) return "bg-green-100";
  if (score >= 60) return "bg-yellow-100";
  return "bg-red-100";
};

const getScoreLabel = (score) => {
  if (score >= 90) return "Excellent";
  if (score >= 80) return "Good";
  if (score >= 60) return "Needs Work";
  return "Poor";
};

export default function SEOScoreIndicator({ blog, showDetails = true }) {
  // Debounce the blog data to prevent recalculating on every keystroke
  const [debouncedBlog, setDebouncedBlog] = useState(blog);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedBlog(blog);
    }, 500); // Wait 500ms after last change

    return () => clearTimeout(timer);
  }, [blog]);

  const { score, checks } = useMemo(
    () => calculateSeoDetails(debouncedBlog || {}), 
    [debouncedBlog]
  );
  
  if (!blog) return null;
  
  const passedChecks = checks.filter(c => c.passed);
  const failedChecks = checks.filter(c => !c.passed && !c.warning);
  const warningChecks = checks.filter(c => !c.passed && c.warning);

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      {/* Score Header */}
      <div className={`p-4 ${getScoreBgColor(score)}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`text-4xl font-bold ${getScoreColor(score)}`}>
              {score}
            </div>
            <div>
              <p className={`font-semibold ${getScoreColor(score)}`}>
                {getScoreLabel(score)}
              </p>
              <p className="text-sm text-gray-600">SEO Score</p>
            </div>
          </div>
          <TrendingUp className={`w-8 h-8 ${getScoreColor(score)}`} />
        </div>
        
        {/* Progress Bar */}
        <div className="mt-3 h-2 bg-white/50 rounded-full overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ${
              score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{ width: `${score}%` }}
          />
        </div>

        {/* Quick Stats */}
        <div className="mt-3 flex items-center gap-4 text-sm">
          <span className="flex items-center gap-1">
            <CheckCircle className="w-4 h-4 text-green-600" />
            {passedChecks.length} passed
          </span>
          <span className="flex items-center gap-1">
            <XCircle className="w-4 h-4 text-red-600" />
            {failedChecks.length} required
          </span>
          {warningChecks.length > 0 && (
            <span className="flex items-center gap-1">
              <AlertCircle className="w-4 h-4 text-amber-600" />
              {warningChecks.length} tips
            </span>
          )}
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="p-4 space-y-4">
          {/* Required - Always show */}
          {failedChecks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Required ({failedChecks.length})
              </h4>
              <ul className="space-y-1.5">
                {failedChecks.map((check) => (
                  <li key={check.id} className="flex items-start gap-2 text-sm">
                    <XCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-700">{check.label}</span>
                    {check.detail && (
                      <span className="text-gray-400 text-xs">({check.detail})</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Suggestions - Always show */}
          {warningChecks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Suggestions ({warningChecks.length})
              </h4>
              <ul className="space-y-1.5">
                {warningChecks.map((check) => (
                  <li key={check.id} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{check.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Passed - Collapsible */}
          {passedChecks.length > 0 && (
            <div>
              <button
                onClick={() => setExpanded(!expanded)}
                className="w-full text-sm font-semibold text-green-700 mb-2 flex items-center gap-2 hover:text-green-800"
              >
                <CheckCircle className="w-4 h-4" />
                Passed ({passedChecks.length})
                <svg 
                  className={`w-4 h-4 ml-auto transition-transform ${expanded ? 'rotate-180' : ''}`} 
                  fill="none" 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {expanded && (
                <ul className="space-y-1.5">
                  {passedChecks.map((check) => (
                    <li key={check.id} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                      <span className="text-gray-600">{check.label}</span>
                      {check.detail && (
                        <span className="text-gray-400 text-xs">({check.detail})</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}