// app/reviews/new/[listingId]/page.jsx
"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { api } from "../../../../utils/api.js";
import { useAuth } from "../../../../contexts/AuthContext.js";
import { toast, Toaster } from "react-hot-toast";
import ReviewFormModal from "../../../../components/ReviewFormModal.jsx";

export default function NewReviewPage() {
  const { listingId } = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  
  const [isLoading, setIsLoading] = useState(true);
  const [listing, setListing] = useState(null);
  const [booking, setBooking] = useState(null);
  const [eligibleBookings, setEligibleBookings] = useState([]);
  const [selectedBookingId, setSelectedBookingId] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  
  const bookingId = searchParams.get("bookingId");

  useEffect(() => {
    if (!user) {
      router.push(`/login?redirect=/reviews/new/${listingId}`);
      return;
    }

    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch listing details
        const listingData = await api(`/api/publicListings/${listingId}`);
        setListing(listingData);

        // If bookingId is provided, fetch that specific booking
        if (bookingId) {
          try {
            const response = await api(`/api/bookings/${bookingId}`);
             // ✅ DEBUG LOGS (correct place)
    console.log("Booking API raw response:", response);
    console.log("Logged-in User ID:", user.id);
            
            const bookingData = response;
            // Verify the booking belongs to the user and is completed
            console.log("Resolved bookingData:", bookingData);

            if (
              Number(bookingData.userId) === Number(user.id) && bookingData.status === "COMPLETED") {
              setBooking(bookingData);
              setSelectedBookingId(bookingData.id);
            } else {
              toast.error("This booking is not eligible for review");
            }
          } catch (error) {
            console.error("Error fetching booking:", error);
            toast.error("Could not load booking details");
          }
        } else {
          // Fetch all eligible bookings for this listing
          const response = await api(`/api/reviews/listings/${listingId}/eligible-bookings`);
          if (response.success && response.bookings) {
            setEligibleBookings(response.bookings);
            if (response.bookings.length === 1) {
              setSelectedBookingId(response.bookings[0].id);
              setBooking(response.bookings[0]);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load listing information");
        router.push(`/listings/${listingId}`);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [listingId, bookingId, user, router]);

  const handleReviewSubmitted = (reviewData) => {
    toast.success("Review submitted successfully!");
    // Redirect back to listing page after a short delay
    setTimeout(() => {
      router.push(`/listings/${listingId}`);
    }, 1500);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-700 mb-2">
            Listing not found
          </h2>
          <button
            onClick={() => router.back()}
            className="text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50 py-12">
      <Toaster position="top-right" />
      
      <div className="max-w-4xl mx-auto px-4">
        {/* Back button */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-stone-600 hover:text-stone-900 font-medium mb-8 group"
        >
          <svg
            className="w-5 h-5 group-hover:-translate-x-1 transition-transform"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 19l-7-7m0 0l7-7m-7 7h18"
            />
          </svg>
          Back
        </button>

        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-4">
            listingpage
          </h1>
          <div className="flex items-start gap-4">
            {listing.images?.[0] && (
              <img
                src={listing.images[0].url}
                alt={listing.title}
                className="w-20 h-20 rounded-xl object-cover"
              />
            )}
            <div>
              <h2 className="text-xl font-semibold text-stone-900">
                {listing.title}
              </h2>
              <p className="text-stone-600">{listing.location}</p>
            </div>
          </div>
        </div>

        {/* Booking Selection (if multiple eligible bookings) */}
        {eligibleBookings.length > 1 && !bookingId && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-xl font-bold text-stone-900 mb-6">
              Select which booking to review
            </h3>
            <div className="space-y-4">
              {eligibleBookings.map((eligibleBooking) => (
                <div
                  key={eligibleBooking.id}
                  className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                    selectedBookingId === eligibleBooking.id
                      ? "border-emerald-500 bg-emerald-50"
                      : "border-stone-200 hover:border-emerald-300"
                  }`}
                  onClick={() => {
                    setSelectedBookingId(eligibleBooking.id);
                    setBooking(eligibleBooking);
                  }}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-stone-900">
                        {new Date(eligibleBooking.bookingDate).toLocaleDateString(
                          "en-US",
                          {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          }
                        )}
                      </p>
                      <p className="text-stone-600">
                        {eligibleBooking.startTime} - {eligibleBooking.endTime} •{" "}
                        {eligibleBooking.guests} guest
                        {eligibleBooking.guests !== 1 ? "s" : ""}
                      </p>
                    </div>
                    {selectedBookingId === eligibleBooking.id && (
                      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                        <svg
                          className="w-4 h-4 text-white"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Booking Details (if a booking is selected) */}
        {booking && (
          <div className="bg-white rounded-2xl shadow-lg p-8 mb-8">
            <h3 className="text-xl font-bold text-stone-900 mb-6">
              Your Booking Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <p className="text-sm text-stone-500">Date</p>
                <p className="font-semibold text-stone-900">
                  {new Date(booking.bookingDate).toLocaleDateString("en-US", {
                    weekday: "long",
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-stone-500">Time</p>
                <p className="font-semibold text-stone-900">
                  {booking.startTime} - {booking.endTime}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-stone-500">Guests</p>
                <p className="font-semibold text-stone-900">
                  {booking.guests} guest{booking.guests !== 1 ? "s" : ""}
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-stone-500">Total</p>
                <p className="font-semibold text-stone-900">
                  ${Number(booking.totalPrice).toFixed(2)}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Start Review Button */}
        <div className="text-center">
          <button
            onClick={() => setShowReviewForm(true)}
            disabled={!selectedBookingId}
            className={`px-8 py-4 text-lg font-bold rounded-xl transition-all ${
              !selectedBookingId
                ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
            }`}
          >
            ✍️ Start Writing Your Review
          </button>
          {!selectedBookingId && (
            <p className="text-stone-500 mt-4">
              Please select a booking to review
            </p>
          )}
        </div>
      </div>
      

      {/* Review Form Modal */}
      {listing && showReviewForm && (
        <ReviewFormModal
        bookingId={booking.id}
          listing={listing}
          user={user}
          userReview={null} // For new review
          showReviewForm={showReviewForm}
          setShowReviewForm={setShowReviewForm}
          onReviewSubmitted={handleReviewSubmitted}
        />
      )}
    </div>
  );
}