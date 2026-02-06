// app/host-stories/page.jsx
// ==========================================
// FEATURED HOST STORIES PAGE
// ==========================================
// Grid of all published host stories
// Great for SEO and AdSense validation
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function HostStoriesPage() {
  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchStories();
  }, []);

  const fetchStories = async () => {
    try {
      const res = await fetch('/api/hosts/stories/featured');
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || 'Failed to load stories');
      }
      
      setStories(data.data || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white">
        <div className="max-w-6xl mx-auto px-4 py-16 md:py-24">
          <nav className="flex items-center gap-2 text-stone-400 text-sm mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <span className="text-stone-300">Host Stories</span>
          </nav>
          
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight">
              Meet Our <span className="text-teal-400">Hosts</span>
            </h1>
            <p className="mt-6 text-lg text-stone-300 leading-relaxed">
              Every venue has a story. Discover the passionate people behind our spaces — 
              their journeys, inspirations, and what makes each experience unique.
            </p>
          </div>
          
          {/* Stats */}
          <div className="flex flex-wrap gap-8 mt-12">
            <div>
              <p className="text-3xl font-bold text-teal-400">{stories.length}+</p>
              <p className="text-stone-400 text-sm">Host Stories</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-teal-400">
                {stories.reduce((acc, s) => acc + (s.host?.listings?.length || 0), 0)}+
              </p>
              <p className="text-stone-400 text-sm">Unique Venues</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stories Grid */}
      <section className="max-w-6xl mx-auto px-4 py-12 md:py-16">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-16">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-stone-600">{error}</p>
            <button onClick={fetchStories} className="mt-4 px-6 py-2 bg-teal-600 text-white rounded-full hover:bg-teal-700 transition-colors">
              Try Again
            </button>
          </div>
        ) : stories.length === 0 ? (
          <div className="text-center py-16">
            <div className="w-20 h-20 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="text-2xl font-serif text-stone-800">No Stories Yet</h2>
            <p className="text-stone-600 mt-2">Check back soon for inspiring host stories.</p>
          </div>
        ) : (
          <>
            {/* Featured Story (First one larger) */}
            {stories[0] && (
              <div className="mb-12">
                <FeaturedStoryCard story={stories[0]} />
              </div>
            )}

            {/* Rest of Stories Grid */}
            {stories.length > 1 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
                {stories.slice(1).map((story) => (
                  <StoryCard key={story.id} story={story} />
                ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-br from-teal-600 to-emerald-600 text-white py-16">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-2xl md:text-3xl font-serif mb-4">
            Are You a Host?
          </h2>
          <p className="text-teal-100 mb-8 max-w-xl mx-auto">
            Share your story with thousands of potential guests. Tell them what makes your space special.
          </p>
          <Link
            href="/host/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3 bg-white text-teal-600 rounded-full hover:bg-stone-100 transition-colors font-medium"
          >
            Share Your Story
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </section>
    </div>
  );
}

// Featured Story Card (Larger, horizontal layout)
function FeaturedStoryCard({ story }) {
  const host = story.host;
  const listing = host?.listings?.[0];
  const currentYear = new Date().getFullYear();
  const yearsHosting = story.hostingSince ? currentYear - story.hostingSince : null;

  return (
    <Link 
      href={`/hosts/${host?.id}/story`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 hover:shadow-xl transition-all"
    >
      <div className="grid md:grid-cols-2 gap-0">
        {/* Image */}
        <div className="relative h-64 md:h-auto bg-stone-200">
          {story.coverImage || listing?.images?.[0] ? (
            <img 
              src={story.coverImage || listing?.images?.[0]?.url || listing?.images?.[0]} 
              alt={story.storyTitle}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-100 to-emerald-100">
              <svg className="w-16 h-16 text-teal-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
          )}
          <div className="absolute top-4 left-4">
            <span className="px-3 py-1 bg-teal-500 text-white text-xs font-medium rounded-full">
              Featured
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 md:p-8 flex flex-col justify-center">
          {/* Host Info */}
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-bold shadow-md">
              {host?.profilePhoto ? (
                <img src={host.profilePhoto} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                host?.name?.charAt(0).toUpperCase() || 'H'
              )}
            </div>
            <div>
              <p className="font-semibold text-stone-800">{host?.name}</p>
              {yearsHosting > 0 && (
                <p className="text-stone-500 text-sm">Hosting for {yearsHosting} years</p>
              )}
            </div>
          </div>

          {/* Tagline */}
          {story.tagline && (
            <p className="text-teal-600 font-medium text-sm mb-2">"{story.tagline}"</p>
          )}

          {/* Title */}
          <h2 className="text-xl md:text-2xl font-serif text-stone-800 group-hover:text-teal-600 transition-colors mb-3">
            {story.storyTitle}
          </h2>

          {/* Excerpt */}
          <p className="text-stone-600 line-clamp-3 mb-4">
            {story.storyContent?.substring(0, 200)}...
          </p>

          {/* Meta */}
          <div className="flex items-center gap-4 text-sm text-stone-500">
            {host?.listings?.length > 0 && (
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {host.listings.length} {host.listings.length === 1 ? 'venue' : 'venues'}
              </span>
            )}
            <span className="text-teal-600 font-medium group-hover:underline">
              Read story →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Regular Story Card
function StoryCard({ story }) {
  const host = story.host;
  const listing = host?.listings?.[0];
  const currentYear = new Date().getFullYear();
  const yearsHosting = story.hostingSince ? currentYear - story.hostingSince : null;

  return (
    <Link 
      href={`/hosts/${host?.id}/story`}
      className="group block bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 hover:shadow-lg transition-all"
    >
      {/* Image */}
      <div className="relative h-48 bg-stone-200 overflow-hidden">
        {story.coverImage || listing?.images?.[0] ? (
          <img 
            src={story.coverImage || listing?.images?.[0]?.url || listing?.images?.[0]} 
            alt={story.storyTitle}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-teal-50 to-emerald-50">
            <svg className="w-12 h-12 text-teal-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
        )}
        
        {/* Host Avatar Overlay */}
        <div className="absolute bottom-3 left-3">
          <div className="w-10 h-10 rounded-full bg-white shadow-lg flex items-center justify-center overflow-hidden ring-2 ring-white">
            {host?.profilePhoto ? (
              <img src={host.profilePhoto} alt="" className="w-full h-full object-cover" />
            ) : (
              <span className="text-teal-600 font-bold">{host?.name?.charAt(0).toUpperCase() || 'H'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Host Name */}
        <p className="text-sm text-stone-500 mb-1">
          {host?.name}
          {yearsHosting > 0 && <span> • {yearsHosting}y hosting</span>}
        </p>

        {/* Title */}
        <h3 className="font-semibold text-stone-800 text-lg group-hover:text-teal-600 transition-colors line-clamp-2 mb-2">
          {story.storyTitle}
        </h3>

        {/* Tagline or Excerpt */}
        {story.tagline ? (
          <p className="text-teal-600 text-sm italic">"{story.tagline}"</p>
        ) : (
          <p className="text-stone-600 text-sm line-clamp-2">
            {story.storyContent?.substring(0, 100)}...
          </p>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-stone-100">
          {host?.listings?.length > 0 && (
            <span className="text-xs text-stone-500">
              {host.listings.length} {host.listings.length === 1 ? 'venue' : 'venues'}
            </span>
          )}
          <span className="text-sm text-teal-600 font-medium group-hover:underline">
            Read →
          </span>
        </div>
      </div>
    </Link>
  );
}