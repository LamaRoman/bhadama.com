// ============================================
// FILE: app/admin/components/tabs/supportApi.js
// ACTION: ADD NEW FILE
// ============================================

import { api } from '@/utils/api';

// ADMIN ENDPOINTS
export const getAllTickets = async (params = {}) => {
  const { status = 'ALL', category = 'ALL', priority = 'ALL', page = 1, limit = 20, search = '' } = params;
  const queryParams = new URLSearchParams({ 
    status, category, priority, page: String(page), limit: String(limit), ...(search && { search })
  }).toString();
  return await api(`/api/support/admin/tickets?${queryParams}`, { method: 'GET' });
};

export const getSupportStats = async () => {
  return await api('/api/support/admin/stats', { method: 'GET' });
};

export const getAdminTicketById = async (ticketId) => {
  return await api(`/api/support/admin/tickets/${ticketId}`, { method: 'GET' });
};

export const adminReplyToTicket = async (ticketId, replyData) => {
  const { message, isInternal = false, newStatus } = replyData;
  return await api(`/api/support/admin/tickets/${ticketId}/reply`, {
    method: 'POST',
    body: { message, isInternal, newStatus }
  });
};

export const updateTicket = async (ticketId, updateData) => {
  return await api(`/api/support/admin/tickets/${ticketId}`, { method: 'PATCH', body: updateData });
};

// CONSTANTS
export const TICKET_CATEGORIES = [
  { value: 'BOOKING', label: 'Booking Issue', icon: '📅' },
  { value: 'PAYMENT', label: 'Payment Issue', icon: '💳' },
  { value: 'LISTING', label: 'Listing Issue', icon: '🏠' },
  { value: 'ACCOUNT', label: 'Account Issue', icon: '👤' },
  { value: 'TECHNICAL', label: 'Technical Issue', icon: '🔧' },
  { value: 'HOST_ISSUE', label: 'Host Issue', icon: '🏠' },
  { value: 'GUEST_ISSUE', label: 'Guest Issue', icon: '👥' },
  { value: 'FEEDBACK', label: 'Feedback', icon: '💬' },
  { value: 'OTHER', label: 'Other', icon: '📋' }
];

export const TICKET_PRIORITIES = [
  { value: 'LOW', label: 'Low', color: '#6b7280' },
  { value: 'MEDIUM', label: 'Medium', color: '#f59e0b' },
  { value: 'HIGH', label: 'High', color: '#ef4444' },
  { value: 'URGENT', label: 'Urgent', color: '#dc2626' }
];

export const TICKET_STATUSES = [
  { value: 'OPEN', label: 'Open', color: '#3b82f6', bgColor: '#eff6ff' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#8b5cf6', bgColor: '#f5f3ff' },
  { value: 'WAITING_USER', label: 'Waiting for User', color: '#f59e0b', bgColor: '#fffbeb' },
  { value: 'WAITING_ADMIN', label: 'Waiting for Support', color: '#ec4899', bgColor: '#fdf2f8' },
  { value: 'RESOLVED', label: 'Resolved', color: '#10b981', bgColor: '#ecfdf5' },
  { value: 'CLOSED', label: 'Closed', color: '#6b7280', bgColor: '#f9fafb' }
];

export const getCategoryInfo = (category) => TICKET_CATEGORIES.find(c => c.value === category) || TICKET_CATEGORIES[8];
export const getPriorityInfo = (priority) => TICKET_PRIORITIES.find(p => p.value === priority) || TICKET_PRIORITIES[1];
export const getStatusInfo = (status) => TICKET_STATUSES.find(s => s.value === status) || TICKET_STATUSES[0];