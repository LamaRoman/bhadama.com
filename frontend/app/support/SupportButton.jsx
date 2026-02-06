// ============================================
// FILE: components/support/SupportButton.jsx
// ACTION: ADD NEW FILE
// USAGE: Place on booking/listing detail pages for contextual support
// ============================================

'use client';

import React, { useState } from 'react';
import { HelpCircle, MessageSquare, Mail, ChevronDown, X } from 'lucide-react';
import CreateTicketModal from '@/app/support/CreateTicketModal';

/**
 * SupportButton - A contextual support button that can be placed on any page
 * 
 * Props:
 * - relatedType: 'BOOKING' | 'LISTING' | null - Links ticket to specific entity
 * - relatedId: number | string - ID of the related entity
 * - defaultCategory: string - Pre-selected category
 * - defaultSubject: string - Pre-filled subject line
 * - variant: 'button' | 'card' | 'floating' - Display style
 * - position: 'bottom-right' | 'bottom-left' - For floating variant
 * 
 * Examples:
 * 
 * On Booking Detail Page:
 * <SupportButton 
 *   relatedType="BOOKING" 
 *   relatedId={booking.id}
 *   defaultCategory="BOOKING"
 *   defaultSubject={`Help with booking #${booking.id}`}
 * />
 * 
 * On Listing Page:
 * <SupportButton 
 *   relatedType="LISTING" 
 *   relatedId={listing.id}
 *   defaultCategory="LISTING"
 * />
 * 
 * Floating Button (in layout):
 * <SupportButton variant="floating" position="bottom-right" />
 */

const SupportButton = ({ 
  relatedType = null,
  relatedId = null,
  defaultCategory = null,
  defaultSubject = '',
  variant = 'button',
  position = 'bottom-right',
  className = ''
}) => {
  const [showModal, setShowModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // Simple button variant
  if (variant === 'button') {
    return (
      <>
        <button
          onClick={() => setShowModal(true)}
          className={`inline-flex items-center gap-2 px-4 py-2 text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium transition-colors ${className}`}
        >
          <HelpCircle className="w-4 h-4" />
          Need Help?
        </button>
        
        <CreateTicketModal 
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          relatedType={relatedType}
          relatedId={relatedId}
          defaultCategory={defaultCategory}
          defaultSubject={defaultSubject}
        />
      </>
    );
  }

  // Card variant - for sidebar or inline help
  if (variant === 'card') {
    return (
      <>
        <div className={`bg-white rounded-xl border border-gray-200 p-4 ${className}`}>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
              <HelpCircle className="w-5 h-5 text-blue-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Need Help?</h3>
              <p className="text-sm text-gray-500 mt-1">
                {relatedType 
                  ? `Get support for this ${relatedType.toLowerCase()}`
                  : 'Our support team is here to help'}
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              onClick={() => setShowModal(true)}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              Create Ticket
            </button>
            <a
              href="mailto:support@mybigyard.com"
              className="px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>
        
        <CreateTicketModal 
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          relatedType={relatedType}
          relatedId={relatedId}
          defaultCategory={defaultCategory}
          defaultSubject={defaultSubject}
        />
      </>
    );
  }

  // Floating variant - fixed position button with dropdown
  if (variant === 'floating') {
    const positionClasses = {
      'bottom-right': 'bottom-6 right-6',
      'bottom-left': 'bottom-6 left-6'
    };

    return (
      <>
        <div className={`fixed ${positionClasses[position]} z-50 ${className}`}>
          {/* Menu */}
          {showMenu && (
            <>
              <div className="fixed inset-0" onClick={() => setShowMenu(false)} />
              <div className={`absolute ${position === 'bottom-right' ? 'right-0' : 'left-0'} bottom-full mb-3 w-64 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden`}>
                <div className="p-4 border-b border-gray-100">
                  <h3 className="font-semibold text-gray-900">How can we help?</h3>
                </div>
                <div className="p-2">
                  <button
                    onClick={() => { setShowMenu(false); setShowModal(true); }}
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg text-left"
                  >
                    <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                      <MessageSquare className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Create Ticket</p>
                      <p className="text-xs text-gray-500">Get help from our team</p>
                    </div>
                  </button>
                  <a
                    href="/support"
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <HelpCircle className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">View My Tickets</p>
                      <p className="text-xs text-gray-500">Check ticket status</p>
                    </div>
                  </a>
                  <a
                    href="mailto:support@mybigyard.com"
                    className="w-full flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center">
                      <Mail className="w-4 h-4 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-900 text-sm">Email Support</p>
                      <p className="text-xs text-gray-500">support@mybigyard.com</p>
                    </div>
                  </a>
                </div>
              </div>
            </>
          )}
          
          {/* Floating Button */}
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="w-14 h-14 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:shadow-xl transition-all flex items-center justify-center"
          >
            {showMenu ? (
              <X className="w-6 h-6" />
            ) : (
              <MessageSquare className="w-6 h-6" />
            )}
          </button>
        </div>
        
        <CreateTicketModal 
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          relatedType={relatedType}
          relatedId={relatedId}
          defaultCategory={defaultCategory}
          defaultSubject={defaultSubject}
        />
      </>
    );
  }

  return null;
};

export default SupportButton;