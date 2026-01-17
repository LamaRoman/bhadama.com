// ============================================
// FILE: app/support/supportApi.js
// ACTION: ADD NEW FILE
// ============================================

import { api } from '@/utils/api';

// USER ENDPOINTS
export const createSupportTicket = async (ticketData) => {
  return await api('/api/support/tickets', { method: 'POST', body: ticketData });
};

export const getUserTickets = async (params = {}) => {
  const { status = 'ALL', page = 1, limit = 10 } = params;
  const queryParams = new URLSearchParams({ status, page: String(page), limit: String(limit) }).toString();
  return await api(`/api/support/tickets?${queryParams}`, { method: 'GET' });
};

export const getTicketById = async (ticketId) => {
  return await api(`/api/support/tickets/${ticketId}`, { method: 'GET' });
};

export const replyToTicket = async (ticketId, message) => {
  return await api(`/api/support/tickets/${ticketId}/reply`, { method: 'POST', body: { message } });
};

export const closeTicket = async (ticketId) => {
  return await api(`/api/support/tickets/${ticketId}/close`, { method: 'PATCH' });
};

// CONSTANTS
export const TICKET_CATEGORIES = [
  { value: 'BOOKING', label: 'Booking Issue', icon: '📅', description: 'Problems with reservations' },
  { value: 'PAYMENT', label: 'Payment Issue', icon: '💳', description: 'Payment or refund questions' },
  { value: 'LISTING', label: 'Listing Issue', icon: '🏠', description: 'Issues with properties' },
  { value: 'ACCOUNT', label: 'Account Issue', icon: '👤', description: 'Login or profile settings' },
  { value: 'TECHNICAL', label: 'Technical Issue', icon: '🔧', description: 'App bugs or problems' },
  { value: 'HOST_ISSUE', label: 'Host Issue', icon: '🏠', description: 'Problems with a host' },
  { value: 'GUEST_ISSUE', label: 'Guest Issue', icon: '👥', description: 'Problems with a guest' },
  { value: 'FEEDBACK', label: 'Feedback', icon: '💬', description: 'Suggestions or feedback' },
  { value: 'OTHER', label: 'Other', icon: '📋', description: 'Other inquiries' }
];

export const TICKET_PRIORITIES = [
  { value: 'LOW', label: 'Low', color: '#6b7280', description: 'General questions' },
  { value: 'MEDIUM', label: 'Medium', color: '#f59e0b', description: 'Normal priority' },
  { value: 'HIGH', label: 'High', color: '#ef4444', description: 'Needs quick response' },
  { value: 'URGENT', label: 'Urgent', color: '#dc2626', description: 'Critical issue' }
];

export const TICKET_STATUSES = [
  { value: 'OPEN', label: 'Open', color: '#3b82f6', bgColor: '#eff6ff' },
  { value: 'IN_PROGRESS', label: 'In Progress', color: '#8b5cf6', bgColor: '#f5f3ff' },
  { value: 'WAITING_USER', label: 'Awaiting Your Reply', color: '#f59e0b', bgColor: '#fffbeb' },
  { value: 'WAITING_ADMIN', label: 'Under Review', color: '#ec4899', bgColor: '#fdf2f8' },
  { value: 'RESOLVED', label: 'Resolved', color: '#10b981', bgColor: '#ecfdf5' },
  { value: 'CLOSED', label: 'Closed', color: '#6b7280', bgColor: '#f9fafb' }
];

export const getCategoryInfo = (category) => TICKET_CATEGORIES.find(c => c.value === category) || TICKET_CATEGORIES[8];
export const getPriorityInfo = (priority) => TICKET_PRIORITIES.find(p => p.value === priority) || TICKET_PRIORITIES[1];
export const getStatusInfo = (status) => TICKET_STATUSES.find(s => s.value === status) || TICKET_STATUSES[0];