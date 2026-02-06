// app/admin/stories/[id]/page.jsx
// ==========================================
// ADMIN STORY REVIEW DETAIL PAGE
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStories } from '@/hooks/useStory';
import StoryStatusBadge from '@/components/story/StoryStatusBadge';
import ProtectedRoute from '@/components/ProtectedRoute';
import api, { getErrorMessage } from '@/utils/api';

function StoryReviewContent() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const storyId = params.id;

  const { approveStory, rejectStory, deleteStory, unpublishStory } = useAdminStories();

  const [story, setStory] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectForm, setShowRejectForm] = useState(false);
  const [toast, setToast] = useState(null);

  const isSuperAdmin = user?.adminRole === 'SUPER_ADMIN';

  useEffect(() => {
    const fetchStory = async () => {
      try {
        const response = await api(`/api/admin/stories/${storyId}`);
        setStory(response.data);
      } catch (err) {
        console.error('Failed to fetch story:', err);
        setToast({ type: 'error', message: 'Failed to load story' });
      } finally {
        setLoading(false);
      }
    };

    if (storyId) {
      fetchStory();
    }
  }, [storyId]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleApprove = async () => {
    setActionLoading(true);
    try {
      await approveStory(story.id);
      setStory(prev => ({ ...prev, status: 'PUBLISHED', rejectionReason: null }));
      showToast('success', 'Story approved and published!');
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim() || rejectReason.length < 10) {
      showToast('error', 'Please provide a detailed rejection reason');
      return;
    }

    setActionLoading(true);
    try {
      await rejectStory(story.id, rejectReason);
      setStory(prev => ({ ...prev, status: 'REJECTED', rejectionReason: rejectReason }));
      setShowRejectForm(false);
      showToast('success', 'Story rejected');
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleUnpublish = async () => {
    setActionLoading(true);
    try {
      await unpublishStory(story.id);
      setStory(prev => ({ ...prev, status: 'PENDING' }));
      showToast('success', 'Story unpublished');
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to permanently delete this story?')) return;
    
    setActionLoading(true);
    try {
      await deleteStory(story.id);
      showToast('success', 'Story deleted');
      router.push('/admin/stories');
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!story) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-slate-800">Story Not Found</h2>
          <button
            onClick={() => router.push('/admin/stories')}
            className="mt-4 px-6 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600"
          >
            Back to Stories
          </button>
        </div>
      </div>
    );
  }

  const listing = story.listing;

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 px-6 py-3 rounded-lg shadow-lg 
          ${toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'} text-white`}
        >
          {toast.message}
        </div>
      )}

      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <button
            onClick={() => router.push('/admin/stories')}
            className="flex items-center gap-2 text-slate-600 hover:text-slate-800 mb-4"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Stories
          </button>

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <StoryStatusBadge status={story.status} />
                <span className="text-sm text-slate-500">ID: {story.id}</span>
              </div>
              <h1 className="text-2xl font-bold text-slate-800">{story.storyTitle}</h1>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2">
              {story.status === 'PENDING' && (
                <>
                  <button
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="px-6 py-2.5 text-white bg-green-500 rounded-lg
                      hover:bg-green-600 transition-colors font-medium disabled:opacity-50"
                  >
                    ✓ Approve
                  </button>
                  <button
                    onClick={() => setShowRejectForm(!showRejectForm)}
                    disabled={actionLoading}
                    className="px-6 py-2.5 text-white bg-red-500 rounded-lg
                      hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
                  >
                    ✗ Reject
                  </button>
                </>
              )}
              {story.status === 'PUBLISHED' && (
                <button
                  onClick={handleUnpublish}
                  disabled={actionLoading}
                  className="px-6 py-2.5 text-amber-700 bg-amber-100 rounded-lg
                    hover:bg-amber-200 transition-colors font-medium disabled:opacity-50"
                >
                  Unpublish
                </button>
              )}
              {isSuperAdmin && (
                <button
                  onClick={handleDelete}
                  disabled={actionLoading}
                  className="px-6 py-2.5 text-red-600 bg-red-50 rounded-lg
                    hover:bg-red-100 transition-colors font-medium disabled:opacity-50"
                >
                  Delete
                </button>
              )}
            </div>
          </div>

          {/* Reject Form */}
          {showRejectForm && (
            <div className="mt-4 p-4 bg-red-50 rounded-xl border border-red-200">
              <label className="block text-sm font-medium text-red-800 mb-2">
                Rejection Reason
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="Explain why this story needs revision..."
                rows={3}
                className="w-full px-4 py-3 rounded-lg border border-red-200 bg-white resize-none
                  focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
              />
              <div className="flex gap-2 mt-3">
                <button
                  onClick={() => setShowRejectForm(false)}
                  className="px-4 py-2 text-slate-600 bg-white rounded-lg border border-slate-300
                    hover:bg-slate-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleReject}
                  disabled={actionLoading || rejectReason.length < 10}
                  className="px-4 py-2 text-white bg-red-500 rounded-lg
                    hover:bg-red-600 transition-colors disabled:opacity-50"
                >
                  Confirm Rejection
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Story Content */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h2 className="text-lg font-semibold text-slate-800 mb-4">Story Content</h2>
              
              {story.tagline && (
                <p className="text-amber-600 font-medium mb-4">"{story.tagline}"</p>
              )}

              <div className="prose prose-slate max-w-none">
                <div className="whitespace-pre-wrap text-slate-700">
                  {story.storyContent}
                </div>
              </div>

              {story.hostMessage && (
                <div className="mt-6 p-4 bg-amber-50 rounded-lg border-l-4 border-amber-400">
                  <p className="text-sm font-medium text-amber-800 mb-1">Host Message:</p>
                  <p className="text-amber-700 italic">{story.hostMessage}</p>
                </div>
              )}
            </div>

            {/* Highlights & Achievements */}
            {(story.highlights?.length > 0 || story.achievements?.length > 0) && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Highlights & Achievements</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {story.highlights?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-3">Highlights</h3>
                      <ul className="space-y-2">
                        {story.highlights.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-amber-500">✓</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {story.achievements?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-slate-600 mb-3">Achievements</h3>
                      <ul className="space-y-2">
                        {story.achievements.map((item, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                            <span className="text-amber-500">🏆</span>
                            {item}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Team */}
            {story.teamMembers?.length > 0 && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Team Members</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {story.teamMembers.map((member, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                      <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-medium">
                        {member.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium text-slate-800">{member.name}</p>
                        <p className="text-sm text-slate-500">{member.role}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Social Links */}
            {(story.websiteUrl || story.facebookUrl || story.instagramUrl || story.tiktokUrl || story.videoUrl) && (
              <div className="bg-white rounded-xl border border-slate-200 p-6">
                <h2 className="text-lg font-semibold text-slate-800 mb-4">Links & Media</h2>
                <div className="space-y-3">
                  {story.videoUrl && (
                    <a href={story.videoUrl} target="_blank" rel="noopener noreferrer" 
                      className="flex items-center gap-2 text-blue-600 hover:underline">
                      🎥 Video: {story.videoUrl}
                    </a>
                  )}
                  {story.websiteUrl && (
                    <a href={story.websiteUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline">
                      🌐 Website: {story.websiteUrl}
                    </a>
                  )}
                  {story.facebookUrl && (
                    <a href={story.facebookUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline">
                      📘 Facebook: {story.facebookUrl}
                    </a>
                  )}
                  {story.instagramUrl && (
                    <a href={story.instagramUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline">
                      📸 Instagram: {story.instagramUrl}
                    </a>
                  )}
                  {story.tiktokUrl && (
                    <a href={story.tiktokUrl} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline">
                      🎵 TikTok: {story.tiktokUrl}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Listing Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Listing</h3>
              {listing?.images?.[0] && (
                <img
                  src={listing.images[0].url || listing.images[0]}
                  alt={listing.title}
                  className="w-full h-40 object-cover rounded-lg mb-4"
                />
              )}
              <h4 className="font-semibold text-slate-800">{listing?.title}</h4>
              <p className="text-sm text-slate-500 mt-1 line-clamp-2">{listing?.description}</p>
              <a
                href={`/listings/${listing?.slug || listing?.id}`}
                target="_blank"
                className="mt-4 inline-block text-sm text-amber-600 hover:underline"
              >
                View Listing →
              </a>
            </div>

            {/* Host Info */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Host</h3>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center text-amber-600 font-semibold text-lg">
                  {listing?.host?.name?.charAt(0) || 'H'}
                </div>
                <div>
                  <p className="font-medium text-slate-800">{listing?.host?.name}</p>
                  <p className="text-sm text-slate-500">{listing?.host?.email}</p>
                </div>
              </div>
              {listing?.host?._count && (
                <p className="text-sm text-slate-500 mt-4">
                  {listing.host._count.listings} listing(s) · Joined {new Date(listing.host.createdAt).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Meta */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-sm font-medium text-slate-500 uppercase tracking-wide mb-4">Details</h3>
              <dl className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Status</dt>
                  <dd><StoryStatusBadge status={story.status} size="small" /></dd>
                </div>
                {story.establishedYear && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Established</dt>
                    <dd className="text-slate-800">{story.establishedYear}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Views</dt>
                  <dd className="text-slate-800">{story.viewCount || 0}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Created</dt>
                  <dd className="text-slate-800">{new Date(story.createdAt).toLocaleDateString()}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Updated</dt>
                  <dd className="text-slate-800">{new Date(story.updatedAt).toLocaleDateString()}</dd>
                </div>
                {story.publishedAt && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Published</dt>
                    <dd className="text-slate-800">{new Date(story.publishedAt).toLocaleDateString()}</dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Rejection History */}
            {story.status === 'REJECTED' && story.rejectionReason && (
              <div className="bg-red-50 rounded-xl border border-red-200 p-6">
                <h3 className="text-sm font-medium text-red-800 uppercase tracking-wide mb-2">Rejection Reason</h3>
                <p className="text-red-700">{story.rejectionReason}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AdminStoryReviewPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <StoryReviewContent />
    </ProtectedRoute>
  );
}