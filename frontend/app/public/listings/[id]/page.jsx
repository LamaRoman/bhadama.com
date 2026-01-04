"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "../../../../utils/api";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../../contexts/AuthContext.js";
import { toast, Toaster } from "react-hot-toast";

// Import modular components from local components folder
import {
  ImageGallery,
  StarRating,
  ReviewsSection,
  BookingCard,
  HostCard,
} from "../components";

export default function PublicListingDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  // Listing & Reviews State
  const [isLoading, setIsLoading] = useState(true);
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({ average: 0, total: 0, distribution: {} });
  const [canUserReview, setCanUserReview] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [eligibleBookingId, setEligibleBookingId] = useState(null);

  // Booking State
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [availabilityData, setAvailabilityData] = useState({});
  const [bookingData, setBookingData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    guests: 1,
  });

  // UI State
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [showFloatingBar, setShowFloatingBar] = useState(false);

  // Refs
  const calendarRef = useRef(null);
  const timeSlotsRef = useRef(null);
  const guestsRef = useRef(null);
  const heroRef = useRef(null);

  // Load calendar availability
  const loadCalendarAvailability = useCallback(async () => {
    if (!listing?.id) return;
    try {
      const year = currentMonth.getFullYear();
      const month = currentMonth.getMonth() + 1;
      const response = await api(`/api/availability/${listing.id}/calendar?year=${year}&month=${month}`);
      if (response?.availability) {
        setAvailabilityData(response.availability);
      }
    } catch (error) {
      console.error("Failed to load availability:", error);
    }
  }, [listing?.id, currentMonth]);

  // Fetch listing data
  const fetchListingData = useCallback(async () => {
    try {
      setIsLoading(true);
      const listingData = await api(`/api/publicListings/${id}`);
      setListing(listingData);

      const reviewsData = await api(`/api/reviews/listings/${id}/reviews`);
      setReviews(reviewsData.reviews || []);
      setReviewStats({
        average: reviewsData.averageRating || 0,
        total: reviewsData.totalReviews || 0,
        distribution: reviewsData.ratingDistribution || {},
      });

      if (user && reviewsData.reviews) {
        const existingReview = reviewsData.reviews.find((r) => r.userId === user.id);
        if (existingReview) setUserReview(existingReview);
      }

      setBookingData((prev) => ({
        ...prev,
        guests: Math.max(1, listingData.minCapacity || 1),
      }));
    } catch (error) {
      toast.error("Failed to load listing");
    } finally {
      setIsLoading(false);
    }
  }, [id, user]);

  // Check review eligibility
  const checkReviewEligibility = useCallback(async () => {
    if (!user || !listing) {
      setCanUserReview(false);
      return;
    }

    const hasReviewed = reviews.some((r) => r.userId === user.id);
    if (hasReviewed) {
      setCanUserReview(false);
      return;
    }

    try {
      const response = await api(`/api/reviews/listings/${id}/can-review`);
      if (response.canReview) {
        setCanUserReview(true);
        setEligibleBookingId(response.bookingId);
      } else {
        setCanUserReview(false);
      }
    } catch {
      setCanUserReview(false);
    }
  }, [user, listing, reviews, id]);

  // Handle booking
  const handleBooking = async () => {
    if (!user) {
      toast.error("Please log in to book");
      router.push(`/auth/login?redirect=${encodeURIComponent(`/public/listings/${id}`)}`);
      return;
    }

    if (!bookingData.date || !bookingData.startTime || !bookingData.endTime) {
      toast.error("Please complete all booking details");
      return;
    }

    if (bookingData.guests > (listing?.capacity || 100)) {
      toast.error(`Maximum capacity is ${listing.capacity} guests`);
      return;
    }

    setIsBooking(true);
    try {
      const data = await api("/api/bookings", {
        method: "POST",
        body: {
          listingId: listing.id,
          userId: user.id,
          bookingDate: bookingData.date,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          guests: bookingData.guests,
        },
      });

      if (data.error) throw new Error(data.error);

      toast.success("🎉 Booking Confirmed!");
      setBookingData({ date: "", startTime: "", endTime: "", guests: 1 });
      setTimeout(() => router.push("/bookings"), 2000);
    } catch (err) {
      toast.error(err.message || "Booking failed");
    } finally {
      setIsBooking(false);
    }
  };

  // Effects
  useEffect(() => {
    if (id) fetchListingData();
  }, [id, fetchListingData]);

  useEffect(() => {
    if (listing?.id) loadCalendarAvailability();
  }, [listing?.id, currentMonth, loadCalendarAvailability]);

  useEffect(() => {
    checkReviewEligibility();
  }, [checkReviewEligibility]);

  // Intersection observer for floating bar
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowFloatingBar(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (heroRef.current) observer.observe(heroRef.current);
    return () => observer.disconnect();
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target)) setShowCalendar(false);
      if (timeSlotsRef.current && !timeSlotsRef.current.contains(e.target)) setShowTimeSlots(false);
      if (guestsRef.current && !guestsRef.current.contains(e.target)) setShowGuests(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Loading state
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

  // Not found state
  if (!listing) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-stone-700 mb-2">Listing not found</h2>
          <button onClick={() => router.back()} className="text-emerald-600 hover:text-emerald-700 font-medium">
            Go back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Toaster position="top-right" />

      {/* HERO SECTION */}
      <div ref={heroRef} className="relative h-[65vh] md:h-[75vh] bg-stone-900 overflow-hidden">
        <ImageGallery images={listing.images} title={listing.title} />

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => router.back()}
              className="mb-6 inline-flex items-center gap-2 text-white/90 hover:text-white font-medium"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>

            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                Available now
              </div>

              <h1 className="text-4xl md:text-6xl font-black text-white mb-4">{listing.title}</h1>

              <div className="flex flex-wrap items-center gap-4 text-white/90">
                <div className="flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  </svg>
                  <span className="font-medium">{listing.location}</span>
                </div>

                {reviewStats.total > 0 && (
                  <div className="flex items-center gap-2">
                    <StarRating rating={reviewStats.average} />
                    <span className="font-medium">
                      {reviewStats.average.toFixed(1)} ({reviewStats.total} reviews)
                    </span>
                  </div>
                )}

                {listing.capacity && (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    <span className="font-medium">Up to {listing.capacity} guests</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING BOOKING BAR */}
      {showFloatingBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-stone-500">Total</p>
                <p className="text-2xl font-bold text-emerald-600">
                  ${(listing?.hourlyRate || 0) * (bookingData.startTime && bookingData.endTime ? 1 : 0)}
                </p>
              </div>
              <button
                onClick={handleBooking}
                disabled={!bookingData.date || !bookingData.startTime || !bookingData.endTime || isBooking}
                className={`px-8 py-3 rounded-xl font-bold transition-all ${
                  !bookingData.date || !bookingData.startTime || !bookingData.endTime || isBooking
                    ? "bg-stone-200 text-stone-400"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                }`}
              >
                {isBooking ? "Booking..." : "Book Now"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MAIN CONTENT */}
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-2 space-y-12">
            {/* Tabs */}
            <div className="border-b border-stone-200">
              <nav className="flex gap-8 overflow-x-auto pb-2">
                {["overview", "amenities", "location", "reviews"].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`pb-3 text-lg font-medium whitespace-nowrap transition-all ${
                      activeTab === tab
                        ? "text-emerald-600 border-b-2 border-emerald-600"
                        : "text-stone-600 hover:text-stone-900"
                    }`}
                  >
                    {tab.charAt(0).toUpperCase() + tab.slice(1)}
                    {tab === "reviews" && reviewStats.total > 0 && (
                      <span className="ml-2 text-sm bg-stone-100 text-stone-600 px-2 py-0.5 rounded-full">
                        {reviewStats.total}
                      </span>
                    )}
                  </button>
                ))}
              </nav>
            </div>

            {/* Tab Content */}
            <div>
              {activeTab === "overview" && (
                <div className="space-y-8">
                  <HostCard host={listing.host} />
                  <div>
                    <h2 className="text-3xl font-bold text-stone-900 mb-4">About this space</h2>
                    <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                      {listing.description || "No description available."}
                    </p>
                  </div>
                </div>
              )}

              {activeTab === "amenities" && listing.amenities?.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {listing.amenities.map((amenity, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm">
                      <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center">
                        <svg className="w-6 h-6 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <span className="font-medium text-stone-800">{amenity}</span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "location" && (
                <div className="bg-white rounded-2xl p-6 shadow-lg">
                  <h3 className="text-xl font-bold text-stone-900 mb-4">Location</h3>
                  <p className="text-stone-700 mb-4">{listing.location}</p>
                  <div className="h-64 bg-stone-200 rounded-lg flex items-center justify-center">
                    <span className="text-stone-500">Map placeholder</span>
                  </div>
                </div>
              )}

              {activeTab === "reviews" && (
                <ReviewsSection
                  reviews={reviews}
                  reviewStats={reviewStats}
                  listingId={id}
                  user={user}
                  canUserReview={canUserReview}
                  userReview={userReview}
                  eligibleBookingId={eligibleBookingId}
                />
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8 space-y-6">
              <BookingCard
                listing={listing}
                bookingData={bookingData}
                setBookingData={setBookingData}
                showCalendar={showCalendar}
                setShowCalendar={setShowCalendar}
                showTimeSlots={showTimeSlots}
                setShowTimeSlots={setShowTimeSlots}
                showGuests={showGuests}
                setShowGuests={setShowGuests}
                currentMonth={currentMonth}
                setCurrentMonth={setCurrentMonth}
                availabilityData={availabilityData}
                isBooking={isBooking}
                handleBooking={handleBooking}
                calendarRef={calendarRef}
                timeSlotsRef={timeSlotsRef}
                guestsRef={guestsRef}
                isOwnListing={user?.id === listing?.hostId}
              />

              {/* Safety Guidelines */}
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                  Safety Guidelines
                </h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Follow host's house rules</li>
                  <li>• No smoking unless permitted</li>
                  <li>• Respect the space and neighbors</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}