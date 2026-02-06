"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext";
import { api } from "../../../utils/api";
import Link from "next/link";
import { 
  CheckCircle2, 
  Calendar, 
  Clock, 
  MapPin, 
  Users, 
  Receipt,
  ArrowRight,
  Download,
  Share2,
  Home,
  Loader2,
  Sparkles,
  PartyPopper
} from "lucide-react";

export default function BookingPaymentSuccessPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const bookingId = searchParams.get("bookingId");
  const refId = searchParams.get("refId");
  
  const { user, loading: authLoading } = useAuth();
  
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Hide confetti after 3 seconds
    const timer = setTimeout(() => setShowConfetti(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const fetchBooking = async () => {
      if (!bookingId) {
        setLoading(false);
        return;
      }

      try {
        const data = await api(`/api/bookings/${bookingId}`);
        if (!data.error) {
          setBooking(data);
        }
      } catch (error) {
        console.error("Failed to fetch booking:", error);
      } finally {
        setLoading(false);
      }
    };

    if (!authLoading) {
      fetchBooking();
    }
  }, [bookingId, authLoading]);

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (time) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  if (loading || authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-emerald-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Loading your booking...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 relative overflow-hidden">
      {/* Animated Background Elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-emerald-200/30 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-cyan-100/20 rounded-full blur-3xl" />
      </div>

      {/* Confetti Effect */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${2 + Math.random() * 2}s`,
              }}
            >
              <div
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: ['#10b981', '#14b8a6', '#06b6d4', '#f59e0b', '#ec4899'][Math.floor(Math.random() * 5)],
                  transform: `rotate(${Math.random() * 360}deg)`,
                }}
              />
            </div>
          ))}
        </div>
      )}

      <div className="relative z-10 py-12 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Success Card */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-emerald-500/10 overflow-hidden border border-white/50">
            {/* Header */}
            <div className="relative bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500 p-8 text-center overflow-hidden">
              {/* Decorative circles */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative">
                <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-600/30 animate-bounce-slow">
                  <CheckCircle2 className="w-14 h-14 text-emerald-500" />
                </div>
                
                <div className="flex items-center justify-center gap-2 mb-2">
                  <PartyPopper className="w-6 h-6 text-yellow-300" />
                  <h1 className="text-3xl font-black text-white">Booking Confirmed!</h1>
                  <PartyPopper className="w-6 h-6 text-yellow-300 scale-x-[-1]" />
                </div>
                
                <p className="text-emerald-100 text-lg">
                  Your space has been reserved successfully
                </p>
                
                {refId && (
                  <div className="mt-4 inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full">
                    <Receipt className="w-4 h-4 text-white" />
                    <span className="text-sm text-white font-medium">
                      Transaction ID: {refId}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Booking Details */}
            {booking ? (
              <div className="p-8">
                {/* Listing Info */}
                <div className="flex items-start gap-4 mb-8 pb-8 border-b border-gray-100">
                  {booking.listing?.images?.[0]?.url ? (
                    <img
                      src={booking.listing.images[0].url}
                      alt={booking.listing.title}
                      className="w-24 h-24 rounded-2xl object-cover shadow-lg"
                    />
                  ) : (
                    <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-emerald-100 to-teal-100 flex items-center justify-center">
                      <Home className="w-10 h-10 text-emerald-400" />
                    </div>
                  )}
                  <div className="flex-1">
                    <h2 className="text-xl font-bold text-gray-900 mb-1">
                      {booking.listing?.title || "Your Booked Space"}
                    </h2>
                    <div className="flex items-center gap-2 text-gray-500">
                      <MapPin className="w-4 h-4" />
                      <span className="text-sm">{booking.listing?.location || "Location"}</span>
                    </div>
                    {booking.listing?.host && (
                      <p className="text-sm text-gray-500 mt-1">
                        Hosted by <span className="font-medium text-gray-700">{booking.listing.host.name}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Booking Info Grid */}
                <div className="grid grid-cols-2 gap-6 mb-8">
                  <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-emerald-600 mb-2">
                      <Calendar className="w-5 h-5" />
                      <span className="text-sm font-semibold uppercase tracking-wide">Date</span>
                    </div>
                    <p className="text-gray-900 font-bold">
                      {formatDate(booking.bookingDate)}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-teal-50 to-cyan-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-teal-600 mb-2">
                      <Clock className="w-5 h-5" />
                      <span className="text-sm font-semibold uppercase tracking-wide">Time</span>
                    </div>
                    <p className="text-gray-900 font-bold">
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {booking.duration} hour{booking.duration !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-cyan-50 to-sky-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-cyan-600 mb-2">
                      <Users className="w-5 h-5" />
                      <span className="text-sm font-semibold uppercase tracking-wide">Guests</span>
                    </div>
                    <p className="text-gray-900 font-bold">
                      {booking.guests} {booking.guests === 1 ? "Guest" : "Guests"}
                    </p>
                  </div>

                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 rounded-2xl p-4">
                    <div className="flex items-center gap-2 text-amber-600 mb-2">
                      <Sparkles className="w-5 h-5" />
                      <span className="text-sm font-semibold uppercase tracking-wide">Status</span>
                    </div>
                    <p className="text-gray-900 font-bold flex items-center gap-2">
                      <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                      {booking.status}
                    </p>
                  </div>
                </div>

                {/* Payment Summary */}
                <div className="bg-gray-50 rounded-2xl p-6 mb-8">
                  <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
                    <Receipt className="w-5 h-5 text-gray-600" />
                    Payment Summary
                  </h3>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Base price</span>
                      <span className="font-medium">Rs.{Number(booking.basePrice).toLocaleString()}</span>
                    </div>
                    
                    {Number(booking.extraGuestPrice) > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Extra guests</span>
                        <span className="font-medium">Rs.{Number(booking.extraGuestPrice).toLocaleString()}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Service fee</span>
                      <span className="font-medium">Rs.{Number(booking.serviceFee).toLocaleString()}</span>
                    </div>
                    
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Tax</span>
                      <span className="font-medium">Rs.{Number(booking.tax).toLocaleString()}</span>
                    </div>
                    
                    <div className="pt-3 border-t border-gray-200 flex justify-between">
                      <span className="font-bold text-gray-900">Total Paid</span>
                      <span className="font-black text-xl text-emerald-600">
                        Rs.{Number(booking.totalPrice).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Booking Number */}
                <div className="text-center mb-8 p-4 bg-emerald-50 rounded-xl border-2 border-dashed border-emerald-200">
                  <p className="text-sm text-emerald-600 font-medium mb-1">Booking Reference</p>
                  <p className="text-2xl font-mono font-bold text-emerald-700 tracking-wider">
                    {booking.bookingNumber || `BK-${booking.id}`}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="space-y-3">
                  <Link
                    href="/users/dashboard"
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30 hover:-translate-y-0.5"
                  >
                    View My Bookings
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => {
                        // TODO: Implement download receipt
                        alert("Receipt download coming soon!");
                      }}
                      className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                    >
                      <Download className="w-5 h-5" />
                      Receipt
                    </button>

                    <button
                      onClick={() => {
                        if (navigator.share) {
                          navigator.share({
                            title: "My Booking",
                            text: `I just booked ${booking.listing?.title}!`,
                            url: window.location.href,
                          });
                        } else {
                          navigator.clipboard.writeText(window.location.href);
                          alert("Link copied to clipboard!");
                        }
                      }}
                      className="flex items-center justify-center gap-2 py-3 border-2 border-gray-200 text-gray-700 font-semibold rounded-xl hover:bg-gray-50 transition-all"
                    >
                      <Share2 className="w-5 h-5" />
                      Share
                    </button>
                  </div>

                  <Link
                    href="/"
                    className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-gray-700 transition-all"
                  >
                    <Home className="w-5 h-5" />
                    Back to Home
                  </Link>
                </div>
              </div>
            ) : (
              /* No booking data - generic success */
              <div className="p-8 text-center">
                <p className="text-gray-600 mb-6">
                  Your booking has been confirmed. You will receive a confirmation email shortly.
                </p>
                
                <div className="space-y-3">
                  <Link
                    href="/users/dashboard"
                    className="w-full flex items-center justify-center gap-2 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-2xl hover:from-emerald-600 hover:to-teal-600 transition-all"
                  >
                    View My Bookings
                    <ArrowRight className="w-5 h-5" />
                  </Link>

                  <Link
                    href="/"
                    className="w-full flex items-center justify-center gap-2 py-3 text-gray-500 hover:text-gray-700 transition-all"
                  >
                    <Home className="w-5 h-5" />
                    Back to Home
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Help Section */}
          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">
              Need help?{" "}
              <a href="mailto:support@mybigyard.com" className="text-emerald-600 hover:underline font-medium">
                Contact Support
              </a>
            </p>
          </div>
        </div>
      </div>

      {/* CSS for animations */}
      <style jsx>{`
        @keyframes confetti {
          0% {
            transform: translateY(-100vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        
        .animate-confetti {
          animation: confetti linear forwards;
        }
        
        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-10px);
          }
        }
        
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}