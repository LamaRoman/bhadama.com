// components/UserBookings.jsx
"use client";

import { useState } from "react";
import { api } from "../app/utils/api.js";

export default function UserBookings({ bookings, setBookings }) {
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const calculateNights = (startDate, endDate) => {
    const start = new Date(startDate);
    const end = new Date(endDate);
    return Math.round((end - start) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < now) return "bg-gray-100 text-gray-600"; // Past
    if (start <= now && end >= now) return "bg-green-100 text-green-700"; // Active
    return "bg-blue-100 text-blue-700"; // Upcoming
  };

  const getStatusText = (startDate, endDate) => {
    const now = new Date();
    const start = new Date(startDate);
    const end = new Date(endDate);

    if (end < now) return "Completed";
    if (start <= now && end >= now) return "Active";
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
      const response = await api(`/api/bookings/${selectedBooking.id}`, {
        method: "DELETE",
      });

      if (response.error) {
        setError(response.error);
      } else {
        // Remove booking from list
        setBookings(bookings.filter((b) => b.id !== selectedBooking.id));
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

  return (
    <div>
      {/* Booking Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {bookings.map((booking) => (
          <div
            key={booking.id}
            onClick={() => handleCardClick(booking)}
            className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            {/* Listing Image */}
            <div className="h-40 bg-gray-200 relative">
              {booking.listing?.images?.[0]?.url ? (
                <img
                  src={booking.listing.images[0].url}
                  alt={booking.listing.title}
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
                className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                  booking.startDate,
                  booking.endDate
                )}`}
              >
                {getStatusText(booking.startDate, booking.endDate)}
              </span>
            </div>

            {/* Booking Info */}
            <div className="p-4">
              <h3 className="font-semibold text-gray-900 truncate">
                {booking.listing?.title || "Listing"}
              </h3>
              <p className="text-sm text-gray-500 truncate">
                {booking.listing?.location || "Location"}
              </p>

              <div className="mt-3 flex items-center justify-between">
                <div className="text-sm">
                  <p className="text-gray-600">
                    {formatDate(booking.startDate).split(",")[1]}
                  </p>
                  <p className="text-gray-400 text-xs">
                    {calculateNights(booking.startDate, booking.endDate)} nights
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    ${booking.listing?.price * calculateNights(booking.startDate, booking.endDate) || "N/A"}
                  </p>
                  <p className="text-gray-400 text-xs">total</p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Booking Detail Modal */}
      {isModalOpen && selectedBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50"
            onClick={closeModal}
          ></div>

          {/* Modal Content */}
          <div className="relative bg-white rounded-2xl shadow-xl max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 p-2 hover:bg-gray-100 rounded-full transition"
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
              {selectedBooking.listing?.images?.[0]?.url ? (
                <img
                  src={selectedBooking.listing.images[0].url}
                  alt={selectedBooking.listing.title}
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
                  selectedBooking.startDate,
                  selectedBooking.endDate
                )}`}
              >
                {getStatusText(selectedBooking.startDate, selectedBooking.endDate)}
              </span>

              <h2 className="text-2xl font-bold text-gray-900">
                {selectedBooking.listing?.title || "Booking Details"}
              </h2>
              <p className="text-gray-500">
                {selectedBooking.listing?.location || ""}
              </p>

              {/* Dates Section */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Check-in
                  </p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formatDate(selectedBooking.startDate)}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-xl">
                  <p className="text-xs text-gray-500 uppercase tracking-wide">
                    Check-out
                  </p>
                  <p className="font-semibold text-gray-900 mt-1">
                    {formatDate(selectedBooking.endDate)}
                  </p>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="mt-6 border-t pt-4">
                <div className="flex justify-between text-gray-600 mb-2">
                  <span>
                    ${selectedBooking.listing?.price} x{" "}
                    {calculateNights(selectedBooking.startDate, selectedBooking.endDate)} nights
                  </span>
                  <span>
                    ${selectedBooking.listing?.price *
                      calculateNights(selectedBooking.startDate, selectedBooking.endDate)}
                  </span>
                </div>
                <div className="flex justify-between font-semibold text-gray-900 text-lg pt-2 border-t">
                  <span>Total</span>
                  <span>
                    ${selectedBooking.listing?.price *
                      calculateNights(selectedBooking.startDate, selectedBooking.endDate)}
                  </span>
                </div>
              </div>

              {/* Error Message */}
              {error && (
                <div className="mt-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {error}
                </div>
              )}

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                {/* Only show cancel for upcoming bookings */}
                {getStatusText(selectedBooking.startDate, selectedBooking.endDate) ===
                  "Upcoming" && (
                  <>
                    <button
                      onClick={handleCancelBooking}
                      disabled={isLoading}
                      className="w-full py-3 px-4 border border-red-500 text-red-500 rounded-xl font-semibold hover:bg-red-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading ? "Cancelling..." : "Cancel Booking"}
                    </button>
                  </>
                )}

                {/* View Listing Button */}
                <button
                  onClick={() => {
                    window.location.href = `/public/listings/${selectedBooking.listingId}`;
                  }}
                  className="w-full py-3 px-4 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-800 transition"
                >
                  View Listing
                </button>

                {/* Contact Host (optional) */}
                <button
                  onClick={() => alert("Contact host feature coming soon!")}
                  className="w-full py-3 px-4 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition"
                >
                  Contact Host
                </button>
              </div>

              {/* Booking ID */}
              <p className="mt-6 text-center text-xs text-gray-400">
                Booking ID: {selectedBooking.id}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}