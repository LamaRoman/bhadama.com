// ============================================
// FILE: app/support/CreateTicketModal.jsx
// ACTION: ADD NEW FILE
// ============================================

'use client';

import React, { useState } from 'react';
import { X, Send, AlertCircle, CheckCircle } from 'lucide-react';
import { createSupportTicket, TICKET_CATEGORIES, TICKET_PRIORITIES } from './supportApi';

const CreateTicketModal = ({ 
  isOpen, 
  onClose, 
  onSuccess,
  // Optional: pre-fill with context
  relatedType = null,  // 'BOOKING' | 'LISTING' | null
  relatedId = null,
  defaultCategory = null,
  defaultSubject = ''
}) => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    category: defaultCategory || '',
    subject: defaultSubject,
    message: '',
    priority: 'MEDIUM'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [createdTicket, setCreatedTicket] = useState(null);

  const handleCategorySelect = (category) => {
    setFormData(prev => ({ ...prev, category }));
    setStep(2);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) {
      setError('Please fill in all fields');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await createSupportTicket({
        ...formData,
        relatedType,
        relatedId
      });
      setCreatedTicket(response.ticket || response);
      setSuccess(true);
      if (onSuccess) onSuccess(response.ticket || response);
    } catch (err) {
      setError(err.message || 'Failed to create ticket');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setFormData({ category: defaultCategory || '', subject: defaultSubject, message: '', priority: 'MEDIUM' });
    setError(null);
    setSuccess(false);
    setCreatedTicket(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl" onClick={(e) => e.stopPropagation()}>
          
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {success ? 'Ticket Created!' : step === 1 ? 'How can we help?' : 'Describe your issue'}
              </h2>
              {!success && <p className="text-sm text-gray-500 mt-0.5">Step {step} of 2</p>}
            </div>
            <button onClick={handleClose} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>

          {/* Success State */}
          {success ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">We've received your request</h3>
              <p className="text-gray-500 mb-2">Ticket #{createdTicket?.ticketNumber}</p>
              <p className="text-sm text-gray-400 mb-6">We'll get back to you as soon as possible.</p>
              <div className="flex gap-3">
                <button onClick={handleClose} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50">
                  Close
                </button>
                <button onClick={() => window.location.href = `/support/${createdTicket?.id}`} className="flex-1 py-2.5 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700">
                  View Ticket
                </button>
              </div>
            </div>
          ) : step === 1 ? (
            /* Step 1: Category Selection */
            <div className="p-6">
              <div className="grid grid-cols-3 gap-3">
                {TICKET_CATEGORIES.map((cat) => (
                  <button
                    key={cat.value}
                    onClick={() => handleCategorySelect(cat.value)}
                    className="p-4 rounded-xl border-2 border-gray-200 hover:border-blue-500 hover:bg-blue-50 transition-all text-center group"
                  >
                    <span className="text-2xl block mb-2">{cat.icon}</span>
                    <span className="text-xs font-medium text-gray-700 group-hover:text-blue-700">{cat.label}</span>
                  </button>
                ))}
              </div>
              
              {relatedType && (
                <div className="mt-4 p-3 bg-blue-50 rounded-xl">
                  <p className="text-sm text-blue-700">
                    📎 This ticket will be linked to your {relatedType.toLowerCase()} #{relatedId}
                  </p>
                </div>
              )}
            </div>
          ) : (
            /* Step 2: Details Form */
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {error && (
                <div className="flex items-center gap-3 p-3 bg-red-50 border border-red-100 rounded-xl">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                  <p className="text-sm text-red-600">{error}</p>
                </div>
              )}

              {/* Selected Category */}
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <span className="text-xl">{TICKET_CATEGORIES.find(c => c.value === formData.category)?.icon}</span>
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{TICKET_CATEGORIES.find(c => c.value === formData.category)?.label}</p>
                </div>
                <button type="button" onClick={() => setStep(1)} className="text-sm text-blue-600 hover:text-blue-700">Change</button>
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Priority</label>
                <div className="flex gap-2">
                  {TICKET_PRIORITIES.map((pri) => (
                    <button
                      key={pri.value}
                      type="button"
                      onClick={() => setFormData(prev => ({ ...prev, priority: pri.value }))}
                      className={`flex-1 py-2 px-3 rounded-lg border-2 text-sm font-medium transition-all ${
                        formData.priority === pri.value 
                          ? 'border-current' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      style={{ 
                        color: formData.priority === pri.value ? pri.color : '#6b7280',
                        backgroundColor: formData.priority === pri.value ? `${pri.color}10` : 'transparent'
                      }}
                    >
                      {pri.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={formData.subject}
                  onChange={(e) => setFormData(prev => ({ ...prev, subject: e.target.value }))}
                  placeholder="Brief description of your issue"
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 focus:outline-none focus:border-blue-500"
                  maxLength={200}
                />
              </div>

              {/* Message */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  value={formData.message}
                  onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="Please provide as much detail as possible..."
                  rows={5}
                  className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 resize-none focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Actions */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 py-3 border-2 border-gray-200 text-gray-600 rounded-xl font-medium hover:bg-gray-50"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading || !formData.subject.trim() || !formData.message.trim()}
                  className="flex-1 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <><Send className="w-5 h-5" /> Submit</>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateTicketModal;