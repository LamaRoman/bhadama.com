// ============================================
// FILE: app/support/[ticketId]/page.jsx
// ACTION: ADD NEW FILE
// ============================================

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { 
  ArrowLeft, Send, Clock, User, Shield, AlertCircle, CheckCircle, 
  XCircle, MoreVertical, RefreshCw
} from 'lucide-react';
import { getTicketById, replyToTicket, closeTicket, getCategoryInfo, getStatusInfo, getPriorityInfo } from '../supportApi';

export default function TicketDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const messagesEndRef = useRef(null);
  const ticketId = params.ticketId;

  const [ticket, setTicket] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [showActions, setShowActions] = useState(false);

  const fetchTicket = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await getTicketById(ticketId);
      setTicket(response.ticket || response);
    } catch (err) {
      setError(err.message || 'Failed to load ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && ticketId) fetchTicket();
  }, [authLoading, user, ticketId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [ticket?.messages]);

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;

    setSending(true);
    try {
      const response = await replyToTicket(ticketId, message.trim());
      setTicket(prev => ({
        ...prev,
        messages: [...(prev.messages || []), response.reply || response],
        status: 'WAITING_ADMIN'
      }));
      setMessage('');
    } catch (err) {
      setError(err.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const handleCloseTicket = async () => {
    if (!window.confirm('Are you sure you want to close this ticket? You can always create a new one if needed.')) return;
    
    try {
      await closeTicket(ticketId);
      setTicket(prev => ({ ...prev, status: 'CLOSED' }));
      setShowActions(false);
    } catch (err) {
      setError(err.message || 'Failed to close ticket');
    }
  };

  const formatDateTime = (d) => new Date(d).toLocaleString('en-US', { 
    month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true 
  });

  // Redirect if not logged in
  if (!authLoading && !user) {
    router.push('/login');
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <RefreshCw className="w-8 h-8 text-blue-500 animate-spin" />
      </div>
    );
  }

  if (error && !ticket) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-500 mb-4">{error}</p>
          <button onClick={() => router.push('/support')} className="text-blue-600 hover:text-blue-700 font-medium">
            Back to Support
          </button>
        </div>
      </div>
    );
  }

  if (!ticket) return null;

  const cat = getCategoryInfo(ticket.category);
  const status = getStatusInfo(ticket.status);
  const priority = getPriorityInfo(ticket.priority);
  const isClosed = ticket.status === 'CLOSED';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button onClick={() => router.push('/support')} className="p-2 hover:bg-gray-100 rounded-lg">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{cat.icon}</span>
                  <h1 className="text-lg font-semibold text-gray-900 line-clamp-1">{ticket.subject}</h1>
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-xs font-mono text-gray-400">{ticket.ticketNumber}</span>
                  <span className="px-2 py-0.5 rounded-full text-xs font-medium" style={{ backgroundColor: status.bgColor, color: status.color }}>
                    {status.label}
                  </span>
                </div>
              </div>
            </div>

            {!isClosed && (
              <div className="relative">
                <button onClick={() => setShowActions(!showActions)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <MoreVertical className="w-5 h-5 text-gray-600" />
                </button>
                
                {showActions && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setShowActions(false)} />
                    <div className="absolute right-0 top-full mt-1 w-48 bg-white rounded-xl shadow-lg border border-gray-200 py-1 z-20">
                      <button
                        onClick={handleCloseTicket}
                        className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                      >
                        <XCircle className="w-4 h-4 text-gray-400" />
                        Close Ticket
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Ticket Info Bar */}
      <div className="bg-gray-100 border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Created {formatDateTime(ticket.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: priority.color }} />
              {priority.label} Priority
            </span>
            {ticket.relatedType && (
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                📎 {ticket.relatedType} #{ticket.relatedId}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
          <div className="bg-red-50 border border-red-100 rounded-xl p-3">
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Messages */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="space-y-4">
            {ticket.messages?.map((msg, index) => {
              const isUser = msg.senderType === 'USER';
              const showDate = index === 0 || 
                new Date(msg.createdAt).toDateString() !== new Date(ticket.messages[index - 1].createdAt).toDateString();

              return (
                <React.Fragment key={msg.id}>
                  {showDate && (
                    <div className="flex items-center gap-4 py-2">
                      <div className="flex-1 h-px bg-gray-200" />
                      <span className="text-xs text-gray-400 font-medium">
                        {new Date(msg.createdAt).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                      </span>
                      <div className="flex-1 h-px bg-gray-200" />
                    </div>
                  )}

                  <div className={`flex gap-3 ${isUser ? 'flex-row-reverse' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${isUser ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                      {msg.sender?.profilePhoto ? (
                        <img src={msg.sender.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover" />
                      ) : isUser ? (
                        <User className="w-5 h-5 text-blue-600" />
                      ) : (
                        <Shield className="w-5 h-5 text-emerald-600" />
                      )}
                    </div>

                    <div className={`flex-1 max-w-[80%] ${isUser ? 'text-right' : ''}`}>
                      <div className={`inline-block rounded-2xl px-4 py-3 ${
                        isUser ? 'bg-blue-600 text-white rounded-tr-md' : 'bg-white border border-gray-200 text-gray-700 rounded-tl-md'
                      }`}>
                        <p className="whitespace-pre-wrap text-sm">{msg.message}</p>
                      </div>
                      <div className={`flex items-center gap-2 mt-1 text-xs text-gray-400 ${isUser ? 'justify-end' : ''}`}>
                        <span className="font-medium">{isUser ? 'You' : msg.sender?.name || 'Support Team'}</span>
                        <span>•</span>
                        <span>{formatDateTime(msg.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      {/* Reply Box or Closed Message */}
      {isClosed ? (
        <div className="bg-gray-100 border-t border-gray-200">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-center gap-2 text-gray-500">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>This ticket has been closed.</span>
              <button onClick={() => router.push('/support')} className="text-blue-600 hover:text-blue-700 font-medium">
                Create new ticket
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white border-t border-gray-200 sticky bottom-0">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <form onSubmit={handleSendReply} className="flex gap-3">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                rows={1}
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
                style={{ minHeight: '48px', maxHeight: '120px' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
                }}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendReply(e);
                  }
                }}
              />
              <button
                type="submit"
                disabled={!message.trim() || sending}
                className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
              >
                {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
              </button>
            </form>
            <p className="text-xs text-gray-400 mt-2 text-center">Press Enter to send, Shift+Enter for new line</p>
          </div>
        </div>
      )}
    </div>
  );
}