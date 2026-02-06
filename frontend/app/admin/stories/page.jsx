// app/admin/stories/page.jsx
// ==========================================
// ADMIN STORY MODERATION PAGE
// ==========================================

'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useAdminStories, useModerationSettings } from '@/hooks/useStory';
import StoryStatusBadge from '@/components/story/StoryStatusBadge';
import ProtectedRoute from '@/components/ProtectedRoute';
import { getErrorMessage } from '@/utils/api';

function AdminStoriesContent() {
  const router = useRouter();
  const { user } = useAuth();
  
  const { 
    stories, 
    pagination, 
    stats, 
    loading, 
    fetchStories, 
    fetchStats,
    approveStory,
    rejectStory,
    deleteStory,
  } = useAdminStories();

  const { settings, fetchSettings, updateSettings } = useModerationSettings();

  const [filters, setFilters] = useState({
    status: '',
    search: '',
    page: 1,
  });
  const [selectedStory, setSelectedStory] = useState(null);
  const [rejectReason, setRejectReason] = useState('');
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [toast, setToast] = useState(null);

  const isSuperAdmin = user?.adminRole === 'SUPER_ADMIN';

  // Fetch data
  useEffect(() => {
    fetchStories(filters);
    fetchStats();
    if (isSuperAdmin) {
      fetchSettings();
    }
  }, [filters, fetchStories, fetchStats]);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 4000);
  };

  const handleApprove = async (story) => {
    setActionLoading(true);
    try {
      await approveStory(story.id);
      showToast('success', 'Story approved and published!');
      fetchStats();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleRejectClick = (story) => {
    setSelectedStory(story);
    setRejectReason('');
    setShowRejectModal(true);
  };

  const handleRejectConfirm = async () => {
    if (!rejectReason.trim() || rejectReason.length < 10) {
      showToast('error', 'Please provide a detailed rejection reason (min 10 characters)');
      return;
    }

    setActionLoading(true);
    try {
      await rejectStory(selectedStory.id, rejectReason);
      showToast('success', 'Story rejected');
      setShowRejectModal(false);
      fetchStats();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteClick = (story) => {
    setSelectedStory(story);
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    setActionLoading(true);
    try {
      await deleteStory(selectedStory.id);
      showToast('success', 'Story deleted permanently');
      setShowDeleteModal(false);
      fetchStats();
    } catch (err) {
      showToast('error', getErrorMessage(err));
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleAutoPublish = async () => {
    try {
      await updateSettings(!settings.autoPublish);
      showToast('success', `Auto-publish ${!settings.autoPublish ? 'enabled' : 'disabled'}`);
    } catch (err) {
      showToast('error', getErrorMessage(err));
    }
  };

  const statusOptions = [
    { value: '', label: 'All Stories' },
    { value: 'PENDING', label: 'Pending Review' },
    { value: 'PUBLISHED', label: 'Published' },
    { value: 'REJECTED', label: 'Rejected' },
    { value: 'DRAFT', label: 'Drafts' },
  ];

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Story Moderation</h1>
              <p className="text-slate-600">Review and approve host stories</p>
            </div>

            {/* Auto-publish toggle (Super Admin only) */}
            {isSuperAdmin && (
              <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-xl">
                <span className="text-sm text-slate-600">Auto-publish:</span>
                <button
                  onClick={handleToggleAutoPublish}
                  className={`relative w-12 h-6 rounded-full transition-colors ${
                    settings.autoPublish ? 'bg-green-500' : 'bg-slate-300'
                  }`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                      settings.autoPublish ? 'left-7' : 'left-1'
                    }`}
                  />
                </button>
                <span className={`text-sm font-medium ${settings.autoPublish ? 'text-green-600' : 'text-slate-500'}`}>
                  {settings.autoPublish ? 'ON' : 'OFF'}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
            {[
              { label: 'Pending', value: stats.pending, color: 'amber' },
              { label: 'Published', value: stats.published, color: 'green' },
              { label: 'Rejected', value: stats.rejected, color: 'red' },
              { label: 'Drafts', value: stats.draft, color: 'slate' },
              { label: 'Total', value: stats.total, color: 'blue' },
            ].map((stat) => (
              <div
                key={stat.label}
                className={`bg-white rounded-xl p-4 border border-slate-200 hover:shadow-sm transition-shadow cursor-pointer
                  ${filters.status === stat.label.toUpperCase() ? 'ring-2 ring-amber-400' : ''}`}
                onClick={() => setFilters(prev => ({ 
                  ...prev, 
                  status: stat.label === 'Total' ? '' : stat.label.toUpperCase(),
                  page: 1 
                }))}
              >
                <p className={`text-3xl font-bold text-${stat.color}-600`}>{stat.value}</p>
                <p className="text-sm text-slate-500">{stat.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-slate-200 p-4 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search by title or host..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value, page: 1 }))}
                className="w-full px-4 py-2.5 rounded-lg border border-slate-300 bg-white
                  focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
              />
            </div>
            <select
              value={filters.status}
              onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value, page: 1 }))}
              className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white
                focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none"
            >
              {statusOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Stories List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-10 h-10 border-4 border-amber-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : stories.length === 0 ? (
          <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-800">No stories found</h3>
            <p className="text-slate-500 mt-1">
              {filters.status ? 'Try changing your filters' : 'No stories have been submitted yet'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {stories.map((story) => (
              <div
                key={story.id}
                className="bg-white rounded-xl border border-slate-200 p-6 hover:shadow-sm transition-shadow"
              >
                <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                  {/* Story Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <StoryStatusBadge status={story.status} size="small" />
                      <span className="text-xs text-slate-400">
                        ID: {story.id}
                      </span>
                    </div>
                    <h3 className="font-semibold text-slate-800 truncate">{story.storyTitle}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      <span className="font-medium">Listing:</span> {story.listing?.title}
                    </p>
                    <p className="text-sm text-slate-500">
                      <span className="font-medium">Host:</span> {story.listing?.host?.name} ({story.listing?.host?.email})
                    </p>
                    <p className="text-xs text-slate-400 mt-2">
                      Updated: {new Date(story.updatedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {/* Actions */}
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => router.push(`/admin/stories/${story.id}`)}
                      className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg
                        hover:bg-slate-200 transition-colors"
                    >
                      Review
                    </button>

                    {story.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => handleApprove(story)}
                          disabled={actionLoading}
                          className="px-4 py-2 text-sm font-medium text-white bg-green-500 rounded-lg
                            hover:bg-green-600 transition-colors disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleRejectClick(story)}
                          disabled={actionLoading}
                          className="px-4 py-2 text-sm font-medium text-white bg-red-500 rounded-lg
                            hover:bg-red-600 transition-colors disabled:opacity-50"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {isSuperAdmin && (
                      <button
                        onClick={() => handleDeleteClick(story)}
                        disabled={actionLoading}
                        className="px-4 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg
                          hover:bg-red-100 transition-colors disabled:opacity-50"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Rejection Reason */}
                {story.status === 'REJECTED' && story.rejectionReason && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                    <p className="text-sm text-red-700">
                      <span className="font-medium">Rejection reason:</span> {story.rejectionReason}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="flex justify-center gap-2 mt-8">
            {Array.from({ length: pagination.pages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setFilters(prev => ({ ...prev, page }))}
                className={`w-10 h-10 rounded-lg font-medium transition-colors ${
                  filters.page === page
                    ? 'bg-amber-500 text-white'
                    : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50'
                }`}
              >
                {page}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-slate-800 mb-4">Reject Story</h3>
            <p className="text-sm text-slate-600 mb-4">
              Please provide a reason for rejection. This will be shown to the host.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Explain why this story needs revision..."
              rows={4}
              className="w-full px-4 py-3 rounded-lg border border-slate-300 bg-white resize-none
                focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none"
            />
            <p className="text-xs text-slate-400 mt-1">Minimum 10 characters</p>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowRejectModal(false)}
                className="flex-1 px-4 py-2.5 text-slate-600 bg-slate-100 rounded-lg
                  hover:bg-slate-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={actionLoading || rejectReason.length < 10}
                className="flex-1 px-4 py-2.5 text-white bg-red-500 rounded-lg
                  hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Rejecting...' : 'Reject Story'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-slate-800 text-center mb-2">Delete Story?</h3>
            <p className="text-sm text-slate-600 text-center mb-6">
              This action cannot be undone. The story "{selectedStory?.storyTitle}" will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="flex-1 px-4 py-2.5 text-slate-600 bg-slate-100 rounded-lg
                  hover:bg-slate-200 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={actionLoading}
                className="flex-1 px-4 py-2.5 text-white bg-red-500 rounded-lg
                  hover:bg-red-600 transition-colors font-medium disabled:opacity-50"
              >
                {actionLoading ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AdminStoriesPage() {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      <AdminStoriesContent />
    </ProtectedRoute>
  );
}