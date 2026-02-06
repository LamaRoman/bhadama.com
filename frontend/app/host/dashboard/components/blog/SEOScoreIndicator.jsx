"use client";

import { useMemo } from "react";
import { 
  CheckCircle, XCircle, AlertCircle, 
  TrendingUp, FileText, Image, Tag, Link
} from "lucide-react";

/**
 * Calculate SEO score based on blog data
 */
const calculateSeoDetails = (blog) => {
  const checks = [];
  let score = 0;

  // Title checks (20 points)
  if (blog.title) {
    if (blog.title.length >= 10) {
      checks.push({ 
        id: "title-exists", 
        label: "Title is present", 
        passed: true, 
        points: 10 
      });
      score += 10;
    }
    
    if (blog.title.length >= 50 && blog.title.length <= 60) {
      checks.push({ 
        id: "title-length", 
        label: "Title length is optimal (50-60 chars)", 
        passed: true, 
        points: 5,
        detail: `${blog.title.length} characters`
      });
      score += 5;
    } else {
      checks.push({ 
        id: "title-length", 
        label: "Title length should be 50-60 chars", 
        passed: false, 
        points: 0,
        detail: `Currently ${blog.title.length} characters`
      });
    }
    
    if (blog.focusKeyword && blog.title.toLowerCase().includes(blog.focusKeyword.toLowerCase())) {
      checks.push({ 
        id: "title-keyword", 
        label: "Focus keyword in title", 
        passed: true, 
        points: 5 
      });
      score += 5;
    } else if (blog.focusKeyword) {
      checks.push({ 
        id: "title-keyword", 
        label: "Add focus keyword to title", 
        passed: false, 
        points: 0 
      });
    }
  } else {
    checks.push({ 
      id: "title-exists", 
      label: "Add a title", 
      passed: false, 
      points: 0 
    });
  }

  // Meta description checks (15 points)
  if (blog.metaDescription) {
    checks.push({ 
      id: "meta-exists", 
      label: "Meta description is present", 
      passed: true, 
      points: 5 
    });
    score += 5;
    
    if (blog.metaDescription.length >= 150 && blog.metaDescription.length <= 160) {
      checks.push({ 
        id: "meta-length", 
        label: "Meta description length is optimal (150-160 chars)", 
        passed: true, 
        points: 5,
        detail: `${blog.metaDescription.length} characters`
      });
      score += 5;
    } else {
      checks.push({ 
        id: "meta-length", 
        label: "Meta description should be 150-160 chars", 
        passed: false, 
        points: 0,
        detail: `Currently ${blog.metaDescription.length} characters`
      });
    }
    
    if (blog.focusKeyword && blog.metaDescription.toLowerCase().includes(blog.focusKeyword.toLowerCase())) {
      checks.push({ 
        id: "meta-keyword", 
        label: "Focus keyword in meta description", 
        passed: true, 
        points: 5 
      });
      score += 5;
    } else if (blog.focusKeyword) {
      checks.push({ 
        id: "meta-keyword", 
        label: "Add focus keyword to meta description", 
        passed: false, 
        points: 0 
      });
    }
  } else {
    checks.push({ 
      id: "meta-exists", 
      label: "Add a meta description", 
      passed: false, 
      points: 0 
    });
  }

  // Content checks (35 points)
  const wordCount = blog.wordCount || 0;
  
  if (wordCount >= 500) {
    checks.push({ 
      id: "word-count-min", 
      label: "Minimum word count (500+)", 
      passed: true, 
      points: 10,
      detail: `${wordCount} words`
    });
    score += 10;
  } else {
    checks.push({ 
      id: "word-count-min", 
      label: `Need ${500 - wordCount} more words (min 500)`, 
      passed: false, 
      points: 0,
      detail: `${wordCount} words`
    });
  }
  
  if (wordCount >= 800) {
    checks.push({ 
      id: "word-count-good", 
      label: "Good content length (800+)", 
      passed: true, 
      points: 5 
    });
    score += 5;
  } else if (wordCount >= 500) {
    checks.push({ 
      id: "word-count-good", 
      label: "Consider writing more (800+ recommended)", 
      passed: false, 
      points: 0,
      warning: true
    });
  }
  
  if (wordCount >= 1500) {
    checks.push({ 
      id: "word-count-excellent", 
      label: "Excellent content length (1500+)", 
      passed: true, 
      points: 5 
    });
    score += 5;
  }
  
  // Check for headings in content
  if (blog.content) {
    if (blog.content.includes("<h2")) {
      checks.push({ 
        id: "has-h2", 
        label: "Contains H2 headings", 
        passed: true, 
        points: 5 
      });
      score += 5;
    } else {
      checks.push({ 
        id: "has-h2", 
        label: "Add H2 headings to structure content", 
        passed: false, 
        points: 0 
      });
    }
    
    if (blog.content.includes("<h3")) {
      checks.push({ 
        id: "has-h3", 
        label: "Contains H3 headings", 
        passed: true, 
        points: 3 
      });
      score += 3;
    }
    
    if (blog.content.includes("<img")) {
      checks.push({ 
        id: "has-images", 
        label: "Contains images in content", 
        passed: true, 
        points: 5 
      });
      score += 5;
    } else {
      checks.push({ 
        id: "has-images", 
        label: "Add images to improve engagement", 
        passed: false, 
        points: 0,
        warning: true
      });
    }
    
    if (blog.content.includes("<a ")) {
      checks.push({ 
        id: "has-links", 
        label: "Contains links", 
        passed: true, 
        points: 2 
      });
      score += 2;
    }
  }

  // Media checks (15 points)
  if (blog.coverImage) {
    checks.push({ 
      id: "cover-image", 
      label: "Cover image is set", 
      passed: true, 
      points: 10 
    });
    score += 10;
  } else {
    checks.push({ 
      id: "cover-image", 
      label: "Add a cover image", 
      passed: false, 
      points: 0 
    });
  }
  
  if (blog.coverImageAlt) {
    checks.push({ 
      id: "cover-alt", 
      label: "Cover image has alt text", 
      passed: true, 
      points: 5 
    });
    score += 5;
  } else if (blog.coverImage) {
    checks.push({ 
      id: "cover-alt", 
      label: "Add alt text to cover image", 
      passed: false, 
      points: 0 
    });
  }

  // Structure checks (15 points)
  if (blog.category && blog.category !== "GENERAL") {
    checks.push({ 
      id: "has-category", 
      label: "Specific category selected", 
      passed: true, 
      points: 5 
    });
    score += 5;
  } else {
    checks.push({ 
      id: "has-category", 
      label: "Select a specific category", 
      passed: false, 
      points: 0 
    });
  }
  
  if (blog.tags && blog.tags.length >= 2) {
    checks.push({ 
      id: "has-tags", 
      label: `Has ${blog.tags.length} tags (min 2)`, 
      passed: true, 
      points: 5 
    });
    score += 5;
  } else {
    checks.push({ 
      id: "has-tags", 
      label: `Add ${2 - (blog.tags?.length || 0)} more tags (min 2)`, 
      passed: false, 
      points: 0 
    });
  }
  
  if (blog.excerpt && blog.excerpt.length >= 100) {
    checks.push({ 
      id: "has-excerpt", 
      label: "Excerpt is set", 
      passed: true, 
      points: 5 
    });
    score += 5;
  } else {
    checks.push({ 
      id: "has-excerpt", 
      label: "Add a custom excerpt", 
      passed: false, 
      points: 0,
      warning: true
    });
  }

  return {
    score: Math.min(score, 100),
    checks
  };
};

/**
 * Get score color based on value
 */
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
  if (score >= 60) return "Needs Improvement";
  return "Poor";
};

export default function SEOScoreIndicator({ blog, showDetails = true }) {
  const { score, checks } = useMemo(() => calculateSeoDetails(blog), [blog]);
  
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
            className={`h-full transition-all duration-500 ${
              score >= 80 ? "bg-green-500" : score >= 60 ? "bg-yellow-500" : "bg-red-500"
            }`}
            style={{ width: `${score}%` }}
          />
        </div>
      </div>

      {/* Details */}
      {showDetails && (
        <div className="p-4 space-y-4">
          {/* Publishing Requirements */}
          {failedChecks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-red-700 mb-2 flex items-center gap-2">
                <XCircle className="w-4 h-4" />
                Required for Publishing ({failedChecks.length})
              </h4>
              <ul className="space-y-1">
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

          {/* Suggestions */}
          {warningChecks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                Suggestions ({warningChecks.length})
              </h4>
              <ul className="space-y-1">
                {warningChecks.map((check) => (
                  <li key={check.id} className="flex items-start gap-2 text-sm">
                    <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">{check.label}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Passed Checks */}
          {passedChecks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-green-700 mb-2 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                Passed ({passedChecks.length})
              </h4>
              <ul className="space-y-1">
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
            </div>
          )}
        </div>
      )}
    </div>
  );
}