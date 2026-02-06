// ============================================
// FILE: app/support/page.jsx
// ACTION: ADD NEW FILE
// ============================================

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Plus, MessageSquare, Clock, ChevronRight, Inbox, RefreshCw, 
  ArrowLeft, HelpCircle, Mail
} from 'lucide-react';
import { getUserTickets, TICKET_STATUSES, getCategoryInfo, getStatusInfo, getPriorityInfo } from './supportApi';
import CreateTicketModal from './CreateTicketModal';

export default function SupportPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [activeStatus, setActiveStatus] = useState('ALL');
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });

  const fetchTickets = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getUserTickets({
        status: params.status || activeStatus,
        page: params.page || pagination.page,
        limit: pagination.limit
      });
      setTickets(response.tickets || []);
      if (response.pagination) setPagination(response.pagination);
    } catch (err) {
      setError(err.message || 'Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user) fetchTickets();
  }, [authLoading, user, activeStatus]);

  const formatDate = (d) => {
    const date = new Date(d);
    const diff = Date.now() - date;
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 1) return 'Just now';
    if (mins < 60) return `${mins}m ago`;
    if (hrs < 24) return `${hrs}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  // Redirect if not logged in
  if (!authLoading && !user) {
    router.push('/login');
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.back()} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Support Center</h1>
                <p className="text-gray-500 mt-1">Get help with your bookings, listings, and account</p>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 shadow-sm"
            >
              <Plus className="w-5 h-5" />
              New Ticket
            </button>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            <button 
              onClick={() => setShowCreateModal(true)}
              className="p-4 bg-blue-50 hover:bg-blue-100 rounded-xl text-left transition-colors"
            >
              <HelpCircle className="w-6 h-6 text-blue-600 mb-2" />
              <p className="font-medium text-gray-900">Create Ticket</p>
              <p className="text-xs text-gray-500 mt-0.5">Get help with an issue</p>
            </button>
            <a 
              href="mailto:support@mybigyard.com"
              className="p-4 bg-gray-50 hover:bg-gray-100 rounded-xl text-left transition-colors"
            >
              <Mail className="w-6 h-6 text-gray-600 mb-2" />
              <p className="font-medium text-gray-900">Email Us</p>
              <p className="text-xs text-gray-500 mt-0.5">support@mybigyard.com</p>
            </a>
          </div>

          {/* Status Tabs */}
          <div className="flex gap-2 mt-6 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveStatus('ALL')}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                activeStatus === 'ALL' ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              All Tickets
            </button>
            {TICKET_STATUSES.filter(s => ['OPEN', 'WAITING_USER', 'IN_PROGRESS', 'RESOLVED'].includes(s.value)).map((status) => (
              <button
                key={status.value}
                onClick={() => setActiveStatus(status.value)}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors`}
                style={{ 
                  backgroundColor: activeStatus === status.value ? status.color : '#f3f4f6',
                  color: activeStatus === status.value ? 'white' : '#4b5563'
                }}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Loading */}
        {loading && tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16">
            <RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" />
            <p className="text-gray-500">Loading tickets...</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-100 rounded-xl p-4 mb-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 bg-white rounded-2xl border border-gray-200">
            <Inbox className="w-16 h-16 text-gray-300 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No tickets yet</h3>
            <p className="text-gray-500 mb-6">Need help? Create a support ticket and we'll assist you.</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700"
            >
              <Plus className="w-5 h-5" />
              Create Your First Ticket
            </button>
          </div>
        )}

        {/* Ticket List */}
        {tickets.length > 0 && (
          <div className="space-y-3">
            {tickets.map((ticket) => {
              const cat = getCategoryInfo(ticket.category);
              const status = getStatusInfo(ticket.status);
              const priority = getPriorityInfo(ticket.priority);
              const lastMessage = ticket.messages?.[ticket.messages.length - 1];
              const hasUnread = ticket.status === 'WAITING_USER';
              
              return (
                <div
                  key={ticket.id}
                  onClick={() => router.push(`/support/${ticket.id}`)}
                  className={`bg-white rounded-xl border p-4 hover:shadow-md transition-all cursor-pointer ${
                    hasUnread ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-gray-100 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">
                      {cat.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: priority.color }} />
                        <span className="text-xs text-gray-400 font-mono">{ticket.ticketNumber}</span>
                        <span 
                          className="px-2 py-0.5 rounded-full text-xs font-medium"
                          style={{ backgroundColor: status.bgColor, color: status.color }}
                        >
                          {status.label}
                        </span>
                        {hasUnread && (
                          <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                            Action needed
                          </span>
                        )}
                      </div>
                      <h3 className="font-semibold text-gray-900 truncate">{ticket.subject}</h3>
                      {lastMessage && (
                        <p className="text-sm text-gray-500 line-clamp-1 mt-1">
                          {lastMessage.senderType === 'ADMIN' ? '🛟 Support: ' : ''}{lastMessage.message}
                        </p>
                      )}
                      <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {formatDate(ticket.updatedAt)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MessageSquare className="w-3.5 h-3.5" />
                          {ticket._count?.messages || ticket.messages?.length || 0} messages
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => fetchTickets({ page: pagination.page - 1 })}
              disabled={pagination.page === 1}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Previous
            </button>
            <span className="text-sm text-gray-500">
              Page {pagination.page} of {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchTickets({ page: pagination.page + 1 })}
              disabled={pagination.page === pagination.totalPages}
              className="px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Create Modal */}
      <CreateTicketModal 
        isOpen={showCreateModal} 
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => fetchTickets()}
      />
    </div>
  );
}