// components/home/FeaturedStories.jsx
// ==========================================
// FEATURED STORIES SECTION
// ==========================================
// Display featured stories on homepage
// ==========================================

'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useFeaturedStories } from '@/hooks/useStory';

export default function FeaturedStories({ limit = 3 }) {
  const { stories, loading, fetchFeatured } = useFeaturedStories();

  useEffect(() => {
    fetchFeatured(limit);
  }, [fetchFeatured, limit]);

  if (loading) {
    return (
      <section className="py-16 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="animate-pulse">
            <div className="h-8 bg-stone-200 rounded w-48 mx-auto mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-2xl p-6 h-64" />
              ))}
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!stories || stories.length === 0) {
    return null; // Don't show section if no stories
  }

  return (
    <section className="py-16 bg-gradient-to-b from-stone-50 to-white">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-amber-600 font-medium tracking-wide uppercase text-sm">
            Discover
          </span>
          <h2 className="text-3xl md:text-4xl font-serif text-stone-800 mt-2">
            Stories Behind Our Venues
          </h2>
          <p className="text-stone-600 mt-3 max-w-2xl mx-auto">
            Every venue has a story. Meet the hosts and discover what makes these spaces special.
          </p>
        </div>

        {/* Stories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {stories.map((story) => (
            <Link
              key={story.id}
              href={`/stories/${story.listingId}`}
              className="group"
            >
              <article className="bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200
                hover:shadow-lg hover:border-stone-300 transition-all duration-300">
                {/* Image */}
                <div className="relative h-48 overflow-hidden bg-stone-200">
                  {story.listing?.images?.[0] && (
                    <img
                      src={story.listing.images[0].url || story.listing.images[0]}
                      alt={story.listing.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  
                  {/* Location Badge */}
                  {story.listing?.city && (
                    <span className="absolute bottom-3 left-3 px-3 py-1 bg-white/90 backdrop-blur-sm 
                      rounded-full text-xs font-medium text-stone-700">
                      📍 {story.listing.city}
                    </span>
                  )}
                </div>

                {/* Content */}
                <div className="p-5">
                  {/* Tagline */}
                  {story.tagline && (
                    <p className="text-amber-600 text-sm font-medium truncate mb-2">
                      {story.tagline}
                    </p>
                  )}

                  {/* Title */}
                  <h3 className="font-semibold text-stone-800 text-lg leading-snug 
                    group-hover:text-amber-600 transition-colors line-clamp-2">
                    {story.storyTitle}
                  </h3>

                  {/* Excerpt */}
                  <p className="text-stone-600 text-sm mt-2 line-clamp-2">
                    {story.storyContent?.substring(0, 120)}...
                  </p>

                  {/* Footer */}
                  <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">
                    {/* Host */}
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center 
                        text-amber-600 font-medium text-sm">
                        {story.listing?.host?.name?.charAt(0) || 'H'}
                      </div>
                      <span className="text-sm text-stone-600">
                        {story.listing?.host?.name || 'Host'}
                      </span>
                    </div>

                    {/* Read More */}
                    <span className="text-amber-600 text-sm font-medium flex items-center gap-1
                      group-hover:gap-2 transition-all">
                      Read
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </span>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* View All Link */}
        <div className="text-center mt-10">
          <Link
            href="/stories"
            className="inline-flex items-center gap-2 px-6 py-3 bg-stone-800 text-white rounded-full
              hover:bg-stone-700 transition-colors"
          >
            View All Stories
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}