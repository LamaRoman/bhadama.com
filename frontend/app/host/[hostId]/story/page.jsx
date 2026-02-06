// app/hosts/[hostId]/story/page.jsx
// ==========================================
// PUBLIC HOST STORY PAGE
// ==========================================
// Editorial-style story display for hosts
// Shows host info + all their listings
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Head from 'next/head';

export default function PublicHostStoryPage() {
  const params = useParams();
  const router = useRouter();
  const hostId = params.hostId;
  
  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (hostId) {
      fetchStory();
    }
  }, [hostId]);

  const fetchStory = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/hosts/${hostId}/story`);
      const data = await res.json();
      
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Story not found');
      }
      
      setStory(data.data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-stone-600">Loading story...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="w-20 h-20 bg-stone-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-10 h-10 text-stone-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h2 className="text-2xl font-serif text-stone-800">Story Not Found</h2>
          <p className="text-stone-600 mt-3">
            This host hasn't shared their story yet, or it's currently being reviewed.
          </p>
          <button
            onClick={() => router.back()}
            className="mt-8 px-8 py-3 bg-stone-800 text-white rounded-full hover:bg-stone-700 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const host = story.host;
  const listings = host?.listings || [];
  const currentYear = new Date().getFullYear();
  const yearsHosting = story.hostingSince ? currentYear - story.hostingSince : null;

  return (
    <>
      <div className="min-h-screen bg-stone-50">
        {/* Hero Section */}
        <div className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white overflow-hidden">
          {/* Background Image */}
          {story.coverImage && (
            <div className="absolute inset-0 opacity-30">
              <img
                src={story.coverImage}
                alt=""
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-stone-900/50 to-stone-900/90" />
            </div>
          )}
          
          {/* Content */}
          <div className="relative max-w-4xl mx-auto px-4 py-16 md:py-24">
            {/* Breadcrumb */}
            <nav className="flex items-center gap-2 text-stone-400 text-sm mb-8">
              <Link href="/" className="hover:text-white transition-colors">Home</Link>
              <span>/</span>
              <Link href="/host-stories" className="hover:text-white transition-colors">Host Stories</Link>
              <span>/</span>
              <span className="text-stone-300">{host?.name}</span>
            </nav>

            {/* Host Avatar & Name */}
            <div className="flex items-center gap-4 mb-6">
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white text-2xl font-bold shadow-xl ring-4 ring-white/20">
                {host?.profilePhoto ? (
                  <img src={host.profilePhoto} alt={host.name} className="w-full h-full rounded-full object-cover" />
                ) : (
                  host?.name?.charAt(0).toUpperCase() || 'H'
                )}
              </div>
              <div>
                <p className="text-stone-400 text-sm">Meet your host</p>
                <h2 className="text-xl md:text-2xl font-semibold">{host?.name}</h2>
              </div>
            </div>

            {/* Tagline */}
            {story.tagline && (
              <p className="text-teal-400 font-medium tracking-wide uppercase text-sm mb-4">
                "{story.tagline}"
              </p>
            )}

            {/* Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-serif leading-tight">
              {story.storyTitle}
            </h1>

            {/* Meta */}
            <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-8 text-stone-300 text-sm">
              {story.hostingSince && (
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span>Est. {story.hostingSince}</span>
                  {yearsHosting > 0 && <span className="text-stone-400">• {yearsHosting} years</span>}
                </div>
              )}
              
              {listings.length > 0 && (
                <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                  <span>{listings.length} {listings.length === 1 ? 'Venue' : 'Venues'}</span>
                </div>
              )}

              {story.viewCount > 0 && (
                <div className="flex items-center gap-2 text-stone-400">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <span>{story.viewCount?.toLocaleString()} views</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main Content */}
        <article className="max-w-3xl mx-auto px-4 py-12 md:py-16">
          
          {/* Story Content */}
          <div className="prose prose-lg prose-stone max-w-none">
            <p className="text-stone-700 whitespace-pre-wrap leading-relaxed text-lg first-letter:text-5xl first-letter:font-serif first-letter:font-bold first-letter:text-teal-600 first-letter:mr-2 first-letter:float-left">
              {story.storyContent}
            </p>
          </div>

          {/* Host Message / Philosophy */}
          {story.hostMessage && (
            <blockquote className="mt-12 border-l-4 border-teal-400 pl-6 py-4 bg-teal-50/50 rounded-r-2xl">
              <p className="text-stone-700 italic text-lg">"{story.hostMessage}"</p>
              <footer className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-emerald-500 flex items-center justify-center text-white font-medium">
                  {host?.name?.charAt(0) || 'H'}
                </div>
                <div>
                  <p className="font-medium text-stone-800">{host?.name}</p>
                  <p className="text-sm text-stone-500">Host</p>
                </div>
              </footer>
            </blockquote>
          )}

          {/* Video */}
          {story.videoUrl && (
            <div className="mt-12">
              <h2 className="text-2xl font-serif text-stone-800 mb-6 flex items-center gap-2">
                <span className="text-teal-500">🎬</span> Watch Our Story
              </h2>
              <div className="aspect-video rounded-2xl overflow-hidden bg-stone-200 shadow-lg">
                <iframe
                  src={getEmbedUrl(story.videoUrl)}
                  title="Host Story Video"
                  className="w-full h-full"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
            </div>
          )}

          {/* Highlights & Specialties */}
          {(story.highlights?.length > 0 || story.specialties?.length > 0) && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
              {story.highlights?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
                  <h3 className="text-xl font-serif text-stone-800 mb-4 flex items-center gap-2">
                    <span className="text-teal-500">✨</span> Highlights
                  </h3>
                  <ul className="space-y-3">
                    {story.highlights.map((item, index) => (
                      <li key={index} className="flex items-start gap-3">
                        <svg className="w-5 h-5 text-teal-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className="text-stone-700">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {story.specialties?.length > 0 && (
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200">
                  <h3 className="text-xl font-serif text-stone-800 mb-4 flex items-center gap-2">
                    <span className="text-teal-500">⭐</span> Specialties
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {story.specialties.map((item, index) => (
                      <span 
                        key={index} 
                        className="px-4 py-2 bg-teal-50 text-teal-700 rounded-full text-sm font-medium"
                      >
                        {item}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fun Facts */}
          {story.funFacts?.length > 0 && (
            <div className="mt-12 bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-6 border border-amber-200">
              <h3 className="text-xl font-serif text-stone-800 mb-4 flex items-center gap-2">
                <span>💡</span> Fun Facts
              </h3>
              <ul className="space-y-3">
                {story.funFacts.map((fact, index) => (
                  <li key={index} className="flex items-start gap-3 text-stone-700">
                    <span className="w-6 h-6 bg-amber-200 text-amber-700 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">
                      {index + 1}
                    </span>
                    {fact}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Social Links */}
          {(story.websiteUrl || story.facebookUrl || story.instagramUrl || story.tiktokUrl) && (
            <div className="mt-12 p-8 bg-gradient-to-br from-stone-100 to-stone-50 rounded-2xl text-center">
              <h3 className="text-xl font-serif text-stone-800 mb-6">Connect With {host?.name?.split(' ')[0] || 'Us'}</h3>
              <div className="flex flex-wrap justify-center gap-3">
                {story.websiteUrl && (
                  <a href={story.websiteUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-stone-700 hover:text-teal-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                    </svg>
                    Website
                  </a>
                )}
                {story.instagramUrl && (
                  <a href={story.instagramUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-stone-700 hover:text-pink-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
                    </svg>
                    Instagram
                  </a>
                )}
                {story.facebookUrl && (
                  <a href={story.facebookUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-stone-700 hover:text-blue-600">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                    </svg>
                    Facebook
                  </a>
                )}
                {story.tiktokUrl && (
                  <a href={story.tiktokUrl} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-2 px-5 py-2.5 bg-white rounded-full shadow-sm hover:shadow-md transition-all text-stone-700 hover:text-stone-900">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z"/>
                    </svg>
                    TikTok
                  </a>
                )}
              </div>
            </div>
          )}
        </article>

        {/* Host's Venues Section */}
        {listings.length > 0 && (
          <section className="bg-white py-12 md:py-16 border-t border-stone-200">
            <div className="max-w-6xl mx-auto px-4">
              <div className="text-center mb-10">
                <h2 className="text-2xl md:text-3xl font-serif text-stone-800">
                  Venues by {host?.name?.split(' ')[0] || 'This Host'}
                </h2>
                <p className="text-stone-600 mt-2">Explore the spaces available for your next event</p>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {listings.map((listing) => (
                  <Link 
                    key={listing.id} 
                    href={`/listings/${listing.slug || listing.id}`}
                    className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-stone-200 hover:shadow-lg transition-all"
                  >
                    <div className="aspect-[4/3] bg-stone-200 overflow-hidden">
                      {listing.images?.[0] ? (
                        <img 
                          src={listing.images[0].url || listing.images[0]} 
                          alt={listing.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-stone-400">
                          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-semibold text-stone-800 text-lg group-hover:text-teal-600 transition-colors">
                        {listing.title}
                      </h3>
                      {listing.location && (
                        <p className="text-stone-500 text-sm mt-1 flex items-center gap-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          {listing.location}
                        </p>
                      )}
                      {listing.pricePerHour && (
                        <p className="mt-3 text-teal-600 font-semibold">
                          From ${listing.pricePerHour}/hour
                        </p>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-teal-600 to-emerald-600 text-white py-12 md:py-16">
          <div className="max-w-3xl mx-auto px-4 text-center">
            <h2 className="text-2xl md:text-3xl font-serif mb-4">Ready to Book?</h2>
            <p className="text-teal-100 mb-8">
              Contact {host?.name?.split(' ')[0] || 'this host'} to discuss your event and find the perfect space.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {listings.length > 0 && (
                <Link
                  href={`/listings/${listings[0].slug || listings[0].id}`}
                  className="inline-flex items-center justify-center gap-2 px-8 py-3 bg-white text-teal-600 rounded-full hover:bg-stone-100 transition-colors font-medium"
                >
                  View Venues
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </Link>
              )}
              <Link
                href="/host-stories"
                className="inline-flex items-center justify-center gap-2 px-8 py-3 border-2 border-white/30 text-white rounded-full hover:bg-white/10 transition-colors font-medium"
              >
                More Host Stories
              </Link>
            </div>
          </div>
        </section>
      </div>
    </>
  );
}

// Helper to convert video URLs to embed URLs
function getEmbedUrl(url) {
  if (!url) return '';
  
  // YouTube
  const ytMatch = url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([^&?/]+)/);
  if (ytMatch) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }
  
  // Vimeo
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }
  
  return url;
}