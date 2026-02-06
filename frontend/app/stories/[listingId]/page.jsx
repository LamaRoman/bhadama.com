// app/stories/[listingId]/page.jsx
// ==========================================
// PUBLIC STORY VIEW PAGE
// ==========================================
// Beautiful, editorial-style story display
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePublicStory } from '@/hooks/useStory';

export default function PublicStoryPage() {
  const params = useParams();
  const router = useRouter();
  const listingId = params.listingId;
  
  const { story, loading, error, fetchStory } = usePublicStory();

  useEffect(() => {
    if (listingId) {
      fetchStory(listingId);
    }
  }, [listingId, fetchStory]);

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
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
            This venue hasn't shared their story yet, or it's currently being reviewed.
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

  const listing = story.listing;

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Hero Section */}
      <div className="relative bg-gradient-to-br from-stone-900 via-stone-800 to-stone-900 text-white overflow-hidden">
        {/* Background Image Overlay */}
        {listing?.images?.[0] && (
          <div className="absolute inset-0 opacity-20">
            <img
              src={listing.images[0].url || listing.images[0]}
              alt=""
              className="w-full h-full object-cover"
            />
          </div>
        )}
        
        {/* Content */}
        <div className="relative max-w-4xl mx-auto px-4 py-20 md:py-32">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-stone-400 text-sm mb-8">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span>/</span>
            <Link href={`/listings/${listing?.slug || listing?.id}`} className="hover:text-white transition-colors">
              {listing?.title}
            </Link>
            <span>/</span>
            <span className="text-stone-300">Story</span>
          </div>

          {/* Tagline */}
          {story.tagline && (
            <p className="text-amber-400 font-medium tracking-wide uppercase text-sm mb-4">
              {story.tagline}
            </p>
          )}

          {/* Title */}
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-serif leading-tight">
            {story.storyTitle}
          </h1>

          {/* Meta */}
          <div className="flex flex-wrap items-center gap-6 mt-8 text-stone-300">
            {story.establishedYear && (
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span>Est. {story.establishedYear}</span>
              </div>
            )}
            
            {listing?.host && (
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-white font-medium">
                  {listing.host.name?.charAt(0) || 'H'}
                </div>
                <span>by {listing.host.name}</span>
              </div>
            )}

            <div className="flex items-center gap-2 text-stone-400">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{story.viewCount?.toLocaleString() || 0} views</span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <article className="max-w-3xl mx-auto px-4 py-16">
        {/* Story Content */}
        <div className="prose prose-lg prose-stone max-w-none">
          <div className="whitespace-pre-wrap text-stone-700 leading-relaxed text-lg">
            {story.storyContent}
          </div>
        </div>

        {/* Host Message */}
        {story.hostMessage && (
          <blockquote className="mt-16 border-l-4 border-amber-400 pl-6 py-4 bg-amber-50/50 rounded-r-2xl">
            <p className="text-stone-700 italic text-lg">"{story.hostMessage}"</p>
            {listing?.host && (
              <footer className="mt-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-white font-medium">
                  {listing.host.name?.charAt(0) || 'H'}
                </div>
                <div>
                  <p className="font-medium text-stone-800">{listing.host.name}</p>
                  <p className="text-sm text-stone-500">Host</p>
                </div>
              </footer>
            )}
          </blockquote>
        )}

        {/* Video */}
        {story.videoUrl && (
          <div className="mt-16">
            <h2 className="text-2xl font-serif text-stone-800 mb-6">Take a Tour</h2>
            <div className="aspect-video rounded-2xl overflow-hidden bg-stone-200">
              <iframe
                src={getEmbedUrl(story.videoUrl)}
                title="Venue Tour"
                className="w-full h-full"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            </div>
          </div>
        )}

        {/* Highlights & Achievements */}
        {(story.highlights?.length > 0 || story.achievements?.length > 0) && (
          <div className="mt-16 grid grid-cols-1 md:grid-cols-2 gap-8">
            {story.highlights?.length > 0 && (
              <div>
                <h2 className="text-2xl font-serif text-stone-800 mb-6 flex items-center gap-2">
                  <span className="text-amber-500">✨</span> Highlights
                </h2>
                <ul className="space-y-3">
                  {story.highlights.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-stone-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {story.achievements?.length > 0 && (
              <div>
                <h2 className="text-2xl font-serif text-stone-800 mb-6 flex items-center gap-2">
                  <span className="text-amber-500">🏆</span> Achievements
                </h2>
                <ul className="space-y-3">
                  {story.achievements.map((item, index) => (
                    <li key={index} className="flex items-start gap-3">
                      <span className="w-2 h-2 bg-amber-400 rounded-full mt-2 flex-shrink-0" />
                      <span className="text-stone-700">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Team */}
        {story.teamMembers?.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-serif text-stone-800 mb-8 flex items-center gap-2">
              <span className="text-amber-500">👥</span> Meet the Team
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {story.teamMembers.map((member, index) => (
                <div key={index} className="bg-white rounded-2xl p-6 shadow-sm border border-stone-200
                  hover:shadow-md transition-shadow">
                  {member.photo ? (
                    <img
                      src={member.photo}
                      alt={member.name}
                      className="w-20 h-20 rounded-full object-cover mx-auto"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 
                      flex items-center justify-center mx-auto text-amber-600 font-bold text-2xl">
                      {member.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <h3 className="text-lg font-semibold text-stone-800 text-center mt-4">{member.name}</h3>
                  <p className="text-amber-600 text-center">{member.role}</p>
                  {member.bio && (
                    <p className="text-sm text-stone-600 text-center mt-3">{member.bio}</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Social Links */}
        {(story.websiteUrl || story.facebookUrl || story.instagramUrl || story.tiktokUrl) && (
          <div className="mt-16 p-8 bg-gradient-to-br from-stone-100 to-stone-50 rounded-2xl">
            <h2 className="text-2xl font-serif text-stone-800 mb-6 text-center">Connect With Us</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {story.websiteUrl && (
                <a
                  href={story.websiteUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm
                    hover:shadow-md transition-all text-stone-700 hover:text-stone-900"
                >
                  <span>🌐</span> Website
                </a>
              )}
              {story.facebookUrl && (
                <a
                  href={story.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm
                    hover:shadow-md transition-all text-stone-700 hover:text-stone-900"
                >
                  <span>📘</span> Facebook
                </a>
              )}
              {story.instagramUrl && (
                <a
                  href={story.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm
                    hover:shadow-md transition-all text-stone-700 hover:text-stone-900"
                >
                  <span>📸</span> Instagram
                </a>
              )}
              {story.tiktokUrl && (
                <a
                  href={story.tiktokUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 px-6 py-3 bg-white rounded-full shadow-sm
                    hover:shadow-md transition-all text-stone-700 hover:text-stone-900"
                >
                  <span>🎵</span> TikTok
                </a>
              )}
            </div>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 text-center">
          <Link
            href={`/listings/${listing?.slug || listing?.id}`}
            className="inline-flex items-center gap-3 px-8 py-4 bg-stone-800 text-white rounded-full
              hover:bg-stone-700 transition-colors text-lg"
          >
            View Venue
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </Link>
        </div>
      </article>
    </div>
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