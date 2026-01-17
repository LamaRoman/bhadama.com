// ============================================
// FILE: app/admin/components/tabs/SupportTab.jsx
// ACTION: ADD NEW FILE
// ============================================

'use client';

import React, { useEffect, useState, useRef } from 'react';
import { 
  Search, Filter, ChevronRight, Clock, User, AlertCircle, CheckCircle, 
  RefreshCw, TrendingUp, Inbox, Eye, ArrowLeft, Send, Shield, Lock, 
  EyeOff, Mail, Phone
} from 'lucide-react';
import { 
  getAllTickets, getSupportStats, getAdminTicketById, adminReplyToTicket,
  updateTicket, TICKET_STATUSES, TICKET_CATEGORIES, TICKET_PRIORITIES,
  getCategoryInfo, getStatusInfo, getPriorityInfo 
} from './supportApi';

const SupportTab = ({ dateRange, onTabChange }) => {
  const [view, setView] = useState('list');
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const messagesEndRef = useRef(null);

  const [tickets, setTickets] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({ status: 'ALL', category: 'ALL', priority: 'ALL' });

  const [currentTicket, setCurrentTicket] = useState(null);
  const [message, setMessage] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [sending, setSending] = useState(false);

  const fetchTickets = async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAllTickets({
        status: params.status ?? filters.status,
        category: params.category ?? filters.category,
        priority: params.priority ?? filters.priority,
        search: params.search ?? searchQuery,
        page: params.page ?? pagination.page,
        limit: params.limit ?? pagination.limit
      });
      setTickets(response.tickets || []);
      if (response.pagination) setPagination(response.pagination);
      if (response.stats) setStats(response.stats);
    } catch (err) {
      setError(err.message || 'Failed to fetch tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await getSupportStats();
      setStats(response.stats || response);
    } catch (err) {
      console.error('Failed to fetch stats:', err);
    }
  };

  const fetchTicketDetail = async (ticketId) => {
    setLoading(true);
    setError(null);
    try {
      const response = await getAdminTicketById(ticketId);
      setCurrentTicket(response.ticket || response);
    } catch (err) {
      setError(err.message || 'Failed to fetch ticket');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTickets(); fetchStats(); }, []);
  useEffect(() => { if (selectedTicketId && view === 'detail') fetchTicketDetail(selectedTicketId); }, [selectedTicketId, view]);
  useEffect(() => { if (view === 'detail') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [currentTicket?.messages, view]);

  const handleSearch = (e) => { e.preventDefault(); fetchTickets({ search: searchQuery, page: 1 }); };
  const handleFilterChange = (key, value) => { const f = { ...filters, [key]: value }; setFilters(f); fetchTickets({ ...f, page: 1 }); };
  const handleViewTicket = (id) => { setSelectedTicketId(id); setView('detail'); };
  const handleBackToList = () => { setView('list'); setSelectedTicketId(null); setCurrentTicket(null); setMessage(''); setIsInternal(false); fetchTickets(); };

  const handleSendReply = async (e) => {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      const response = await adminReplyToTicket(selectedTicketId, { message: message.trim(), isInternal });
      setCurrentTicket(prev => ({
        ...prev,
        messages: [...(prev.messages || []), response.reply || response],
        status: isInternal ? prev.status : 'WAITING_USER'
      }));
      setMessage('');
      setIsInternal(false);
    } catch (err) {
      setError(err.message || 'Failed to send reply');
    } finally {
      setSending(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await updateTicket(selectedTicketId, { status: newStatus });
      setCurrentTicket(prev => ({ ...prev, status: newStatus }));
      setTickets(prev => prev.map(t => t.id === selectedTicketId ? { ...t, status: newStatus } : t));
    } catch (err) {
      setError(err.message || 'Failed to update status');
    }
  };

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

  const formatDateTime = (d) => new Date(d).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

  const StatCard = ({ title, value, icon: Icon, color, bgColor }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
      <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: bgColor }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500">{title}</p>
    </div>
  );

  const StatusBadge = ({ status }) => {
    const info = getStatusInfo(status);
    return <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium" style={{ backgroundColor: info.bgColor, color: info.color }}>{info.label}</span>;
  };

  const PriorityBadge = ({ priority }) => {
    const info = getPriorityInfo(priority);
    return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-medium" style={{ backgroundColor: `${info.color}15`, color: info.color }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: info.color }} />
        {info.label}
      </span>
    );
  };

  // ============== DETAIL VIEW ==============
  if (view === 'detail' && currentTicket) {
    const catInfo = getCategoryInfo(currentTicket.category);

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={handleBackToList} className="p-2 hover:bg-gray-100 rounded-lg"><ArrowLeft className="w-5 h-5 text-gray-600" /></button>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-2xl">{catInfo.icon}</span>
                <h2 className="text-lg font-semibold text-gray-900">{currentTicket.subject}</h2>
              </div>
              <p className="text-sm text-gray-500 font-mono">{currentTicket.ticketNumber}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={currentTicket.status} />
            <PriorityBadge priority={currentTicket.priority} />
          </div>
        </div>

        {error && <div className="bg-red-50 border border-red-100 rounded-xl p-4"><p className="text-red-600 text-sm">{error}</p></div>}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col" style={{ minHeight: '500px', maxHeight: '700px' }}>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentTicket.messages?.map((msg) => {
                const isUser = msg.senderType === 'USER';
                const isInternalNote = msg.isInternal;
                return (
                  <div key={msg.id} className={`flex gap-3 ${isInternalNote ? 'opacity-80' : ''}`}>
                    <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center ${isInternalNote ? 'bg-amber-100' : isUser ? 'bg-blue-100' : 'bg-emerald-100'}`}>
                      {msg.sender?.profilePhoto ? <img src={msg.sender.profilePhoto} alt="" className="w-10 h-10 rounded-full object-cover" /> : 
                       isInternalNote ? <Lock className="w-5 h-5 text-amber-600" /> : 
                       isUser ? <User className="w-5 h-5 text-blue-600" /> : <Shield className="w-5 h-5 text-emerald-600" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-gray-900 text-sm">{msg.sender?.name || (isUser ? 'User' : 'Support')}</span>
                        {isInternalNote && <span className="text-xs text-amber-600 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1"><EyeOff className="w-3 h-3" />Internal</span>}
                        <span className="text-xs text-gray-400">{formatDateTime(msg.createdAt)}</span>
                      </div>
                      <div className={`rounded-xl px-4 py-3 ${isInternalNote ? 'bg-amber-50 border border-amber-200' : isUser ? 'bg-blue-50 border border-blue-100' : 'bg-gray-50 border border-gray-100'}`}>
                        <p className="text-gray-700 whitespace-pre-wrap text-sm break-words">{msg.message}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t border-gray-200 p-4">
              <form onSubmit={handleSendReply}>
                <div className="flex items-center justify-between mb-3">
                  <button type="button" onClick={() => setIsInternal(!isInternal)}
                    className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${isInternal ? 'bg-amber-100 text-amber-700 border border-amber-300' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
                    {isInternal ? <><EyeOff className="w-4 h-4" /> Internal Note</> : <><Eye className="w-4 h-4" /> Public Reply</>}
                  </button>
                </div>
                <div className="flex gap-3">
                  <textarea value={message} onChange={(e) => setMessage(e.target.value)} placeholder={isInternal ? "Add internal note..." : "Reply to customer..."} rows={3}
                    className={`flex-1 px-4 py-3 border rounded-xl resize-none focus:outline-none focus:ring-2 ${isInternal ? 'border-amber-300 focus:ring-amber-500 bg-amber-50' : 'border-gray-200 focus:ring-blue-500'}`} />
                  <button type="submit" disabled={!message.trim() || sending}
                    className={`px-5 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center gap-2 self-end ${isInternal ? 'bg-amber-500 text-white hover:bg-amber-600' : 'bg-blue-600 text-white hover:bg-blue-700'}`}>
                    {sending ? <RefreshCw className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Customer</h3>
              <div className="flex items-center gap-3 mb-4">
                {currentTicket.user?.profilePhoto ? <img src={currentTicket.user.profilePhoto} alt="" className="w-12 h-12 rounded-full object-cover" /> : <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center"><User className="w-6 h-6 text-gray-400" /></div>}
                <div>
                  <p className="font-semibold text-gray-900">{currentTicket.user?.name}</p>
                  <p className="text-sm text-gray-500 capitalize">{currentTicket.user?.role?.toLowerCase()}</p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-gray-600"><Mail className="w-4 h-4 text-gray-400" /><a href={`mailto:${currentTicket.user?.email}`} className="text-blue-600 hover:underline truncate">{currentTicket.user?.email}</a></div>
                {currentTicket.user?.phone && <div className="flex items-center gap-2 text-gray-600"><Phone className="w-4 h-4 text-gray-400" />{currentTicket.user.phone}</div>}
              </div>
              {currentTicket.user?._count && (
                <div className="grid grid-cols-2 gap-2 mt-4 pt-4 border-t border-gray-100">
                  <div className="text-center p-2 bg-gray-50 rounded-lg"><p className="text-lg font-bold text-gray-900">{currentTicket.user._count.bookings || 0}</p><p className="text-xs text-gray-500">Bookings</p></div>
                  <div className="text-center p-2 bg-gray-50 rounded-lg"><p className="text-lg font-bold text-gray-900">{currentTicket.user._count.listings || 0}</p><p className="text-xs text-gray-500">Listings</p></div>
                </div>
              )}
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Quick Actions</h3>
              <div className="space-y-2">
                {TICKET_STATUSES.filter(s => s.value !== currentTicket.status).slice(0, 4).map(s => (
                  <button key={s.value} onClick={() => handleUpdateStatus(s.value)} className="w-full px-4 py-2 text-left text-sm rounded-lg border border-gray-200 hover:bg-gray-50 flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full" style={{ backgroundColor: s.color }} />Mark as {s.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Details</h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between"><span className="text-gray-500">Category</span><span className="text-gray-900">{catInfo.icon} {catInfo.label}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Created</span><span className="text-gray-900">{formatDateTime(currentTicket.createdAt)}</span></div>
                <div className="flex justify-between"><span className="text-gray-500">Messages</span><span className="text-gray-900">{currentTicket.messages?.length || 0}</span></div>
                {currentTicket.relatedType && <div className="flex justify-between"><span className="text-gray-500">Related</span><span className="text-gray-900">{currentTicket.relatedType} #{currentTicket.relatedId}</span></div>}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ============== LIST VIEW ==============
  return (
    <div className="space-y-6">
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Tickets" value={stats.totalTickets || 0} icon={Inbox} color="#6366f1" bgColor="#eef2ff" />
          <StatCard title="Open Tickets" value={stats.openTickets || 0} icon={AlertCircle} color="#f59e0b" bgColor="#fffbeb" />
          <StatCard title="Resolved Today" value={stats.resolvedToday || 0} icon={CheckCircle} color="#10b981" bgColor="#ecfdf5" />
          <StatCard title="High Priority" value={(stats.byPriority?.HIGH || 0) + (stats.byPriority?.URGENT || 0)} icon={TrendingUp} color="#ef4444" bgColor="#fef2f2" />
        </div>
      )}

      <div className="bg-white rounded-xl border border-gray-200 p-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-4">
          <form onSubmit={handleSearch} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input type="text" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} placeholder="Search tickets..." className="w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </form>
          <button onClick={() => setShowFilters(!showFilters)} className={`inline-flex items-center gap-2 px-4 py-2.5 border rounded-xl ${showFilters ? 'border-blue-500 text-blue-600 bg-blue-50' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            <Filter className="w-5 h-5" />Filters
          </button>
          <button onClick={() => { fetchTickets(); fetchStats(); }} className="p-2.5 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-xl border border-gray-200">
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-gray-100">
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Status</label><select value={filters.status} onChange={(e) => handleFilterChange('status', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option value="ALL">All Statuses</option>{TICKET_STATUSES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Category</label><select value={filters.category} onChange={(e) => handleFilterChange('category', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option value="ALL">All Categories</option>{TICKET_CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.icon} {c.label}</option>)}</select></div>
            <div><label className="block text-sm font-medium text-gray-700 mb-2">Priority</label><select value={filters.priority} onChange={(e) => handleFilterChange('priority', e.target.value)} className="w-full px-3 py-2 border border-gray-200 rounded-lg"><option value="ALL">All Priorities</option>{TICKET_PRIORITIES.map(p => <option key={p.value} value={p.value}>{p.label}</option>)}</select></div>
          </div>
        )}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {[{ status: 'ALL', label: 'All' }, { status: 'OPEN', label: 'Open' }, { status: 'WAITING_ADMIN', label: 'Needs Response' }, { status: 'IN_PROGRESS', label: 'In Progress' }].map(tab => (
          <button key={tab.status} onClick={() => handleFilterChange('status', tab.status)} className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap ${filters.status === tab.status ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>{tab.label}</button>
        ))}
      </div>

      {error && <div className="bg-red-50 border border-red-100 rounded-xl p-4"><p className="text-red-600">{error}</p></div>}
      {loading && tickets.length === 0 && <div className="flex flex-col items-center py-16"><RefreshCw className="w-8 h-8 text-blue-500 animate-spin mb-4" /><p className="text-gray-500">Loading...</p></div>}
      {!loading && tickets.length === 0 && <div className="flex flex-col items-center py-16 bg-white rounded-xl border"><Inbox className="w-12 h-12 text-gray-300 mb-4" /><h3 className="text-lg font-semibold text-gray-900">No tickets found</h3></div>}

      {tickets.length > 0 && (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Ticket</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden md:table-cell">Category</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden sm:table-cell">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-gray-500 uppercase hidden lg:table-cell">Updated</th>
                <th className="px-4 py-3 w-10"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {tickets.map((ticket) => {
                const cat = getCategoryInfo(ticket.category);
                return (
                  <tr key={ticket.id} onClick={() => handleViewTicket(ticket.id)} className="hover:bg-gray-50 cursor-pointer">
                    <td className="px-4 py-4"><div className="flex items-start gap-3"><span className="text-xl">{cat.icon}</span><div><p className="font-medium text-gray-900 truncate max-w-[200px]">{ticket.subject}</p><p className="text-xs text-gray-400 font-mono">{ticket.ticketNumber}</p></div></div></td>
                    <td className="px-4 py-4"><div className="flex items-center gap-2">{ticket.user?.profilePhoto ? <img src={ticket.user.profilePhoto} alt="" className="w-8 h-8 rounded-full" /> : <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center"><User className="w-4 h-4 text-gray-400" /></div>}<div><p className="text-sm font-medium text-gray-900 truncate">{ticket.user?.name}</p><p className="text-xs text-gray-400 truncate">{ticket.user?.email}</p></div></div></td>
                    <td className="px-4 py-4 hidden md:table-cell"><span className="text-sm text-gray-600">{cat.label}</span></td>
                    <td className="px-4 py-4"><StatusBadge status={ticket.status} /></td>
                    <td className="px-4 py-4 hidden sm:table-cell"><PriorityBadge priority={ticket.priority} /></td>
                    <td className="px-4 py-4 hidden lg:table-cell"><div className="flex items-center gap-1 text-sm text-gray-500"><Clock className="w-3.5 h-3.5" />{formatDate(ticket.updatedAt)}</div></td>
                    <td className="px-4 py-4"><ChevronRight className="w-5 h-5 text-gray-300" /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">Page {pagination.page} of {pagination.totalPages}</p>
          <div className="flex gap-2">
            <button onClick={() => fetchTickets({ page: pagination.page - 1 })} disabled={pagination.page === 1} className="px-4 py-2 text-sm bg-white border rounded-lg disabled:opacity-50">Previous</button>
            <button onClick={() => fetchTickets({ page: pagination.page + 1 })} disabled={pagination.page === pagination.totalPages} className="px-4 py-2 text-sm bg-white border rounded-lg disabled:opacity-50">Next</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SupportTab;