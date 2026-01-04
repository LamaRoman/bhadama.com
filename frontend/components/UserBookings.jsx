// components/UserBookings.jsx
"use client";

import { useState } from "react";
import { api } from "../utils/api.js";

export default function UserBookings({ bookings, setBookings }) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  // Helper to safely format price
  const formatPrice = (amount) => {
    if (amount === null || amount === undefined || isNaN(amount)) {
      return "$0.00";
    }
    
    const numAmount = typeof amount === 'number' ? amount : parseFloat(amount);
    
    if (isNaN(numAmount)) {
      return "$0.00";
    }
    
    return numAmount.toLocaleString('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateString) => {
    if (!dateString) return "Date not set";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const formatShortDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
  };

  const formatTime = (timeString) => {
    if (!timeString) return "";
    const [hours, minutes] = timeString.split(":").map(Number);
    const period = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, "0")} ${period}`;
  };

  // Calculate duration in hours
  const calculateDuration = (startTime, endTime) => {
    if (!startTime || !endTime) return 0;
    
    const [startHours, startMinutes] = startTime.split(":").map(Number);
    const [endHours, endMinutes] = endTime.split(":").map(Number);
    
    const startTotalMinutes = startHours * 60 + startMinutes;
    const endTotalMinutes = endHours * 60 + endMinutes;
    
    const durationMinutes = endTotalMinutes - startTotalMinutes;
    
    // Handle overnight bookings
    if (durationMinutes < 0) {
      return (durationMinutes + 24 * 60) / 60;
    }
    
    return durationMinutes / 60;
  };

  // For hourly bookings, we don't have check-in/check-out, just date + time slots
  const getStatusColor = (status, bookingDate, startTime) => {
    const now = new Date();
    const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
    
    if (status === "CANCELLED") return "bg-gray-100 text-gray-600";
    if (status === "PENDING") return "bg-yellow-100 text-yellow-700";
    if (status === "COMPLETED") return "bg-green-100 text-green-700";
    
    if (bookingDateTime < now) return "bg-green-100 text-green-700"; // Completed
    if (bookingDateTime.toDateString() === now.toDateString()) return "bg-blue-100 text-blue-700"; // Today/Active
    return "bg-purple-100 text-purple-700"; // Upcoming
  };

  const getStatusText = (status, bookingDate, startTime) => {
    const now = new Date();
    const bookingDateTime = new Date(`${bookingDate}T${startTime}`);
    
    if (status === "CANCELLED") return "Cancelled";
    if (status === "PENDING") return "Pending";
    if (status === "COMPLETED") return "Completed";
    
    if (bookingDateTime < now) return "Completed";
    if (bookingDateTime.toDateString() === now.toDateString()) return "Today";
    return "Upcoming";
  };

  const handleCardClick = (booking) => {
    setSelectedBooking(booking);
    setIsModalOpen(true);
    setError("");
  };

  const handleCancelBooking = async () => {
    if (!selectedBooking) return;

    const confirmed = window.confirm(
      "Are you sure you want to cancel this booking? This action cannot be undone."
    );

    if (!confirmed) return;

    setIsLoading(true);
    setError("");

    try {
      const response = await api(`/api/bookings/${selectedBooking.id}/cancel`, {
        method: "PUT",
      });

      if (response.error) {
        setError(response.error);
      } else {
        setBookings(bookings.map(b => 
          b.id === selectedBooking.id 
            ? { ...b, status: "CANCELLED" }
            : b
        ));
        setIsModalOpen(false);
        setSelectedBooking(null);
      }
    } catch (err) {
      console.error(err);
      setError("Failed to cancel booking. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedBooking(null);
    setError("");
  };

  // Helper to get image URL
  const getImageUrl = (booking) => {
    const images = booking.listing?.images;
    
    if (!images || !Array.isArray(images) || images.length === 0) {
      return null;
    }
    
    const firstImage = images[0];
    if (firstImage.url) return firstImage.url;
    if (firstImage.imageUrl) return firstImage.imageUrl;
    if (firstImage.image_url) return firstImage.image_url;
    if (typeof firstImage === 'string') return firstImage;
    
    return null;
  };

  // Calculate total price safely
  const calculateTotalPrice = (booking) => {
    if (!booking) return 0;
    
    // Use totalPrice if available
    if (booking.totalPrice !== undefined && booking.totalPrice !== null) {
      return parseFloat(booking.totalPrice);
    }
    
    // Calculate from hourly rate
    const duration = calculateDuration(booking.startTime, booking.endTime);
    const hourlyRate = booking.listing?.hourlyRate || booking.listing?.price || booking.basePrice || 0;
    
    let total = duration * parseFloat(hourlyRate);
    
    // Add extra fees if they exist and are greater than 0
    if (booking.extraGuestPrice && parseFloat(booking.extraGuestPrice) > 0) total += parseFloat(booking.extraGuestPrice);
    if (booking.serviceFee && parseFloat(booking.serviceFee) > 0) total += parseFloat(booking.serviceFee);
    if (booking.tax && parseFloat(booking.tax) > 0) total += parseFloat(booking.tax);
    
    return total;
  };

  // Get guests count
  const getGuests = (booking) => {
    return booking.guests || booking.numberOfGuests || 1;
  };

  // Helper to check if a fee should be shown (exists and > 0)
  const shouldShowFee = (feeAmount) => {
    return feeAmount !== undefined && feeAmount !== null && parseFloat(feeAmount) > 0;
  };

  return (
    <div>
      {/* Booking Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookings.map((booking) => {
          const duration = calculateDuration(booking.startTime, booking.endTime);
          const imageUrl = getImageUrl(booking);
          const totalPrice = calculateTotalPrice(booking);
          const status = getStatusText(booking.status, booking.bookingDate, booking.startTime);
          const statusColor = getStatusColor(booking.status, booking.bookingDate, booking.startTime);
          
          return (
            <div
              key={booking.id}
              onClick={() => handleCardClick(booking)}
              className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
            >
              {/* Listing Image */}
              <div className="h-40 bg-gray-200 relative">
                {imageUrl ? (
                  <img
                    src={imageUrl}
                    alt={booking.listing?.title || "Listing"}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg
                      className="h-12 w-12 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                      />
                    </svg>
                  </div>
                )}

                {/* Status Badge */}
                <span
                  className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${statusColor}`}
                >
                  {status}
                </span>
              </div>

              {/* Booking Info */}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 truncate">
                  {booking.listing?.title || "Booking"}
                </h3>
                <p className="text-sm text-gray-500 truncate">
                  {booking.listing?.location || "Location not specified"}
                </p>

                <div className="mt-3 space-y-2">
                  {/* Date */}
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span className="text-gray-600">
                      {formatShortDate(booking.bookingDate)}
                    </span>
                  </div>

                  {/* Time Slot */}
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-600">
                      {formatTime(booking.startTime)} - {formatTime(booking.endTime)}
                    </span>
                  </div>

                  {/* Duration */}
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-gray-600">
                      {duration.toFixed(1)} hours
                    </span>
                  </div>

                  {/* Guests */}
                  <div className="flex items-center gap-2 text-sm">
                    <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                    <span className="text-gray-600">
                      {getGuests(booking)} guest{getGuests(booking) !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between pt-4 border-t border-gray-100">
                  <div>
                    <p className="text-xs text-gray-500">Total</p>
                    <p className="font-semibold text-gray-900">
                      {formatPrice(totalPrice)}
                    </p>
                  </div>
                  <span className="text-sm text-blue-600 hover:text-blue-800">
                    View details →
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Booking Detail Modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-auto max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 bg-white/90 hover:bg-white rounded-full transition z-10"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            {/* Listing Image */}
            <div className="h-48 bg-gray-200">
              {getImageUrl(selectedBooking) ? (
                <img
                  src={getImageUrl(selectedBooking)}
                  alt={selectedBooking.listing?.title || "Listing"}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg
                    className="h-16 w-16 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1.5}
                      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
                    />
                  </svg>
                </div>
              )}
            </div>

            {/* Booking Details */}
            <div className="p-6">
              {/* Status Badge */}
              <span
                className={`inline-block px-3 py-1 rounded-full text-sm font-medium mb-3 ${getStatusColor(
                  selectedBooking.status,
                  selectedBooking.bookingDate,
                  selectedBooking.startTime
                )}`}
              >
                {getStatusText(selectedBooking.status, selectedBooking.bookingDate, selectedBooking.startTime)}
              </span>

              <h2 className="text-2xl font-bold text-gray-900">
                {selectedBooking.listing?.title || "Booking Details"}
              </h2>
              <p className="text-gray-500">
                {selectedBooking.listing?.location || ""}
              </p>

              {/* Booking Schedule Details */}
              <div className="mt-6 space-y-4">
                <h3 className="font-semibold text-gray-900">Booking Schedule</h3>
                
                {/* Date Section */}
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">Date</p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formatDate(selectedBooking.bookingDate)}
                  </p>
                </div>

                {/* Time Section */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Start Time</p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {formatTime(selectedBooking.startTime)}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">End Time</p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {formatTime(selectedBooking.endTime)}
                    </p>
                  </div>
                </div>

                {/* Duration & Guests */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Duration</p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {calculateDuration(selectedBooking.startTime, selectedBooking.endTime).toFixed(1)} hours
                    </p>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-xl">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Guests</p>
                    <p className="font-semibold text-gray-900 mt-1">
                      {getGuests(selectedBooking)} guest{getGuests(selectedBooking) !== 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="mt-6 border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-4">Price Breakdown</h3>
                <div className="space-y-2">
                  {/* Base Price */}
                  {(selectedBooking.basePrice || selectedBooking.listing?.hourlyRate) && (
                    <div className="flex justify-between text-gray-600">
                      <span>
                        {formatPrice(selectedBooking.basePrice || selectedBooking.listing?.hourlyRate)} ×{" "}
                        {calculateDuration(selectedBooking.startTime, selectedBooking.endTime).toFixed(1)} hours
                      </span>
                      <span>
                        {formatPrice(
                          (parseFloat(selectedBooking.basePrice || selectedBooking.listing?.hourlyRate || 0)) *
                          calculateDuration(selectedBooking.startTime, selectedBooking.endTime)
                        )}
                      </span>
                    </div>
                  )}

                  {/* Extra Guest Charges - ONLY show if > 0 */}
                  {shouldShowFee(selectedBooking.extraGuestPrice) && (
                    <div className="flex justify-between text-gray-600">
                      <span>Extra Guest Charges</span>
                      <span>{formatPrice(selectedBooking.extraGuestPrice)}</span>
                    </div>
                  )}

                  {/* Service Fee - ONLY show if > 0 */}
                  {shouldShowFee(selectedBooking.serviceFee) && (
                    <div className="flex justify-between text-gray-600">
                      <span>Service Fee</span>
                      <span>{formatPrice(selectedBooking.serviceFee)}</span>
                    </div>
                  )}

                  {/* Tax - ONLY show if > 0 */}
                  {shouldShowFee(selectedBooking.tax) && (
                    <div className="flex justify-between text-gray-600">
                      <span>Tax</span>
                      <span>{formatPrice(selectedBooking.tax)}</span>
                    </div>
                  )}

                  {/* Total */}
                  <div className="flex justify-between font-semibold text-gray-900 text-lg pt-2 border-t">
                    <span>Total Amount</span>
                    <span>{formatPrice(calculateTotalPrice(selectedBooking))}</span>
                  </div>
                </div>
              </div>

              {/* Special Requests */}
              {selectedBooking.specialRequests && (
                <div className="mt-6 border-t pt-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Special Requests</h3>
                  <p className="text-gray-700 bg-gray-50 p-3 rounded-lg">
                    {selectedBooking.specialRequests}
                  </p>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {/* Cancel button for upcoming bookings only */}
                {getStatusText(selectedBooking.status, selectedBooking.bookingDate, selectedBooking.startTime) === "Upcoming" && (
                  <button
                    onClick={handleCancelBooking}
                    disabled={isLoading}
                    className="w-full py-3 px-4 border border-red-500 text-red-500 rounded-xl font-semibold hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isLoading ? "Cancelling..." : "Cancel Booking"}
                  </button>
                )}

                {/* View Listing Button */}
                {selectedBooking.listingId && (
                  <button
                    onClick={() => {
                      window.location.href = `/public/listings/${selectedBooking.listingId}`;
                    }}
                    className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition"
                  >
                    View Listing
                  </button>
                )}

                {/* Contact Host */}
                <button
                  onClick={() => alert("Contact host feature coming soon!")}
                  className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Contact Host
                </button>
              </div>

              {/* Booking Info */}
              <div className="mt-6 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                <p>Booking ID: {selectedBooking.id}</p>
                {selectedBooking.bookingNumber && (
                  <p>Booking Number: {selectedBooking.bookingNumber}</p>
                )}
                {selectedBooking.createdAt && (
                  <p>Booked on: {formatDate(selectedBooking.createdAt)}</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}