"use client";

import { useState } from "react";
import {
  Phone, Mail, MessageCircle, Clock,
  HelpCircle, FileText, ExternalLink,
  ChevronDown, ChevronUp
} from "lucide-react";

// FAQ Data
const FAQ_ITEMS = [
  {
    question: "How do I create a listing?",
    answer: "Go to your Host Dashboard and click 'Add New Listing'. Fill in the details about your space including photos, pricing, amenities, and availability. Once submitted, our team will review and approve it within 24-48 hours."
  },
  {
    question: "How does the commission work?",
    answer: "We charge a small commission on each successful booking. The commission rate depends on your subscription tier: Free (10%), Basic (7%), Pro (5%), Premium (3%). The commission is automatically deducted when you receive payment."
  },
  {
    question: "When do I get paid?",
    answer: "Payments are processed within 24-48 hours after the booking is completed. The amount (minus commission) is transferred directly to your registered bank account or wallet."
  },
  {
    question: "How can I upgrade my plan?",
    answer: "Go to the Subscription tab and click 'Upgrade' or 'Change Plan'. You can upgrade anytime and only pay the difference. When you upgrade, new features are available immediately."
  },
  {
    question: "What happens if I cancel my subscription?",
    answer: "If you cancel, you'll retain access to your current plan until the billing period ends. After that, you'll be moved to the Free tier. Your listings won't be deleted, but some may be hidden if they exceed Free tier limits."
  },
  {
    question: "How do I handle booking cancellations?",
    answer: "Go to Bookings in your dashboard and find the booking you want to cancel. Click on it and select 'Cancel Booking'. Depending on your cancellation policy, the guest may receive a full or partial refund."
  },
];

export default function SupportTab() {
  const [openFaq, setOpenFaq] = useState(null);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-gray-900">Help & Support</h2>
        <p className="text-gray-600">We're here to help you succeed</p>
      </div>

      {/* Contact Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Phone Support (Nepal) */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Phone className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Phone Support</h3>
              <p className="text-sm text-gray-500 mt-1">For Nepal users</p>
              <a 
                href="tel:+977-9800000000" 
                className="text-lg font-bold text-green-600 mt-2 block hover:underline"
              >
                +977-9800000000
              </a>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Clock className="w-3 h-3" />
                <span>Sun-Fri, 9 AM - 6 PM</span>
              </div>
            </div>
          </div>
        </div>

        {/* Email Support */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Email Support</h3>
              <p className="text-sm text-gray-500 mt-1">For all users</p>
              <a 
                href="mailto:support@mybigyard.com" 
                className="text-lg font-bold text-blue-600 mt-2 block hover:underline"
              >
                support@mybigyard.com
              </a>
              <div className="flex items-center gap-1 text-xs text-gray-500 mt-1">
                <Clock className="w-3 h-3" />
                <span>Response within 24 hours</span>
              </div>
            </div>
          </div>
        </div>

        {/* Live Chat (Coming Soon) */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Live Chat</h3>
              <p className="text-sm text-gray-500 mt-1">For international users</p>
              <span className="inline-block mt-2 px-3 py-1 bg-purple-100 text-purple-700 text-sm font-medium rounded-full">
                Coming Soon
              </span>
              <p className="text-xs text-gray-500 mt-2">
                Real-time chat support launching soon
              </p>
            </div>
          </div>
        </div>

        {/* Help Center */}
        <div className="bg-white rounded-xl border p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center flex-shrink-0">
              <HelpCircle className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Help Center</h3>
              <p className="text-sm text-gray-500 mt-1">Browse articles & guides</p>
              <a 
                href="/help" 
                target="_blank"
                className="inline-flex items-center gap-1 text-amber-600 font-medium mt-2 hover:underline"
              >
                Visit Help Center
                <ExternalLink className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div className="bg-white rounded-xl border overflow-hidden">
        <div className="p-4 border-b bg-gray-50">
          <h3 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Frequently Asked Questions
          </h3>
        </div>

        <div className="divide-y">
          {FAQ_ITEMS.map((item, index) => (
            <div key={index}>
              <button
                onClick={() => toggleFaq(index)}
                className="w-full p-4 flex items-center justify-between text-left hover:bg-gray-50"
              >
                <span className="font-medium text-gray-900">{item.question}</span>
                {openFaq === index ? (
                  <ChevronUp className="w-5 h-5 text-gray-400 flex-shrink-0" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                )}
              </button>
              {openFaq === index && (
                <div className="px-4 pb-4">
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Quick Links */}
      <div className="bg-gray-50 rounded-xl p-6">
        <h3 className="font-semibold text-gray-900 mb-4">Quick Links</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a 
            href="/terms" 
            className="p-3 bg-white rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:shadow-sm transition-all text-center"
          >
            Terms of Service
          </a>
          <a 
            href="/privacy" 
            className="p-3 bg-white rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:shadow-sm transition-all text-center"
          >
            Privacy Policy
          </a>
          <a 
            href="/host-guidelines" 
            className="p-3 bg-white rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:shadow-sm transition-all text-center"
          >
            Host Guidelines
          </a>
          <a 
            href="/cancellation-policy" 
            className="p-3 bg-white rounded-lg text-sm text-gray-600 hover:text-gray-900 hover:shadow-sm transition-all text-center"
          >
            Cancellation Policy
          </a>
        </div>
      </div>

      {/* Emergency Notice */}
      <div className="bg-red-50 border border-red-100 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
            <Phone className="w-5 h-5 text-red-600" />
          </div>
          <div>
            <p className="font-medium text-red-900">Emergency During a Booking?</p>
            <p className="text-sm text-red-700 mt-1">
              For urgent issues during an active booking, call our emergency line: 
              <a href="tel:+977-9800000001" className="font-bold ml-1 hover:underline">
                +977-9800000001
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}