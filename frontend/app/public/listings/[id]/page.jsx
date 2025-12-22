"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { api } from "../../../utils/api.js";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "../../../contexts/AuthContext.js";
import Image from "next/image";
import { toast, Toaster } from "react-hot-toast";
import StarRatings from "react-star-ratings";

const formatDateLocal = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export default function PublicListingDetail() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [eligibleBookingId, setEligibleBookingId] = useState(null);

  const [isLoading, setIsLoading] = useState(true);
  const [listing, setListing] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewStats, setReviewStats] = useState({
    average: 0,
    total: 0,
    distribution: {},
  });
  const [canUserReview, setCanUserReview] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [checkingReviewEligibility, setCheckingReviewEligibility] =
    useState(false);
  const [reviewEligibilityReason, setReviewEligibilityReason] = useState("");

  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimeSlots, setShowTimeSlots] = useState(false);
  const [showGuests, setShowGuests] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [unavailableDates, setUnavailableDates] = useState(new Set());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [activeTab, setActiveTab] = useState("overview");

  const calendarRef = useRef(null);
  const timeSlotsRef = useRef(null);
  const guestsRef = useRef(null);
  const heroRef = useRef(null);
  const reviewFormRef = useRef(null);

  const [bookingData, setBookingData] = useState({
    date: "",
    startTime: "",
    endTime: "",
    guests: 1,
  });

  const [reviewForm, setReviewForm] = useState({
    rating: 0,
    title: "",
    comment: "",
    cleanliness: 5,
    accuracy: 5,
    communication: 5,
    location: 5,
    checkin: 5,
    value: 5,
  });

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Add floating booking bar state
  const [showFloatingBar, setShowFloatingBar] = useState(false);

  // Intersection Observer for floating booking bar
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setShowFloatingBar(!entry.isIntersecting);
      },
      { threshold: 0.1 }
    );

    if (heroRef.current) {
      observer.observe(heroRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handler = (e) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target))
        setShowCalendar(false);
      if (timeSlotsRef.current && !timeSlotsRef.current.contains(e.target))
        setShowTimeSlots(false);
      if (guestsRef.current && !guestsRef.current.contains(e.target))
        setShowGuests(false);
      if (
        reviewFormRef.current &&
        !reviewFormRef.current.contains(e.target) &&
        showReviewForm
      ) {
        setShowReviewForm(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [showReviewForm]);

  // Fetch listing data and reviews
  useEffect(() => {
    if (!id) return;
    fetchListingData();
  }, [id]);

  // Check if user can review
  useEffect(() => {
    if (user && listing) {
      checkIfUserCanReview();
    } else {
      // Reset if no user or listing
      setCanUserReview(false);
    }
  }, [user, listing, reviews]);

  // Check availability for selected date
  useEffect(() => {
    if (bookingData.date) {
      checkAvailability(bookingData.date);
    }
  }, [bookingData.date]);

  const fetchListingData = async () => {
    try {
      setIsLoading(true);
      // Fetch listing
      const listingData = await api(`/api/publicListings/${id}`);
      setListing(listingData);

      // Fetch reviews
      const reviewsData = await api(`/api/reviews/listings/${id}/reviews`);
      setReviews(reviewsData.reviews || []);
      setReviewStats({
        average: reviewsData.averageRating || 0,
        total: reviewsData.totalReviews || 0,
        distribution: reviewsData.ratingDistribution || {},
      });

      // Check if user has already reviewed
      if (user && reviewsData.reviews) {
        const userReview = reviewsData.reviews.find(
          (r) => r.userId === user.id
        );
        if (userReview) {
          setUserReview(userReview);
        }
      }

      // Initialize guests to 1 or minimum capacity
      setBookingData((prev) => ({
        ...prev,
        guests: Math.max(1, listingData.minCapacity || 1),
      }));
    } catch (error) {
      toast.error("Failed to load listing");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkIfUserCanReview = async () => {
    setCheckingReviewEligibility(true);
    setReviewEligibilityReason("");

    try {
      if (!user || !user.id) {
        setReviewEligibilityReason("Please login to leave a review");
        setCanUserReview(false);
        return;
      }

      // FIRST: Check if user has already reviewed (local check)
      const hasAlreadyReviewed = reviews.some(
        (review) => review.userId === user.id
      );
      if (hasAlreadyReviewed) {
        setReviewEligibilityReason("You've already reviewed this listing");
        setCanUserReview(false);
        return;
      }

      // SECOND: Try to call the API endpoint
      try {
        const response = await api(`/api/reviews/listings/${id}/can-review`);

        if (response.success === false) {
          setCanUserReview(false);
          setReviewEligibilityReason(
            response.reason || "Cannot review at this time"
          );

          // Show helpful toast for specific cases
          if (response.code === "NO_BOOKINGS") {
            toast.info("Book this space to leave a review!");
          } else if (response.code === "BOOKING_NOT_COMPLETED") {
            toast.info(`Complete your booking to review`);
          }
          return;
        }

        if (response.canReview) {
          setCanUserReview(true);
          setEligibleBookingId(response.bookingId); // 🔥 REQUIRED
          setReviewEligibilityReason("You can review this listing");
        } else {
          setCanUserReview(false);
          setReviewEligibilityReason(
            response.reason || "Cannot review at this time"
          );
        }
      } catch (apiError) {
        console.log("API endpoint not available, using client-side fallback");

        // Fallback: Simple check - if user hasn't reviewed, they can review
        // (This is a temporary fallback until backend is ready)
        setCanUserReview(!hasAlreadyReviewed);
        setReviewEligibilityReason(
          hasAlreadyReviewed
            ? "You've already reviewed this listing"
            : "You can leave a review"
        );
      }
    } catch (error) {
      console.error("Failed to check review eligibility:", error);
      setCanUserReview(false);
      setReviewEligibilityReason("Unable to check review eligibility");
    } finally {
      setCheckingReviewEligibility(false);
    }
  };

  const checkAvailability = async (date) => {
    if (!listing?.id) {
      console.warn("Listing ID is missing, cannot check availability");
      return;
    }

    setCheckingAvailability(true);

    try {
      console.log(
        "Calling availability API for listing:",
        listing.id,
        "date:",
        date
      );
      const response = await api(
        `/api/publicListings/${listing.id}/availability?date=${date}`
      );

      const unavailableDates = response?.unavailableDates || [];
      setUnavailableDates(new Set(unavailableDates));

      if (unavailableDates.includes(date)) {
        setBookingData((prev) => ({ ...prev, startTime: "", endTime: "" }));
        toast.error("Selected date is unavailable");
      }
    } catch (error) {
      console.error("Failed to check availability:", error);
      toast.error("Failed to check availability");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleLeaveReview = (bookingId) => {
    if (!user) {
      toast.error("Please login to leave a review");
      router.push(`/login?redirect=/listings/${id}`);
      return;
    }

    router.push(`/reviews/new/${id}?bookingId=${bookingId}`);
  };

  const daysInMonth = () => {
    const y = currentMonth.getFullYear();
    const m = currentMonth.getMonth();
    return {
      days: new Date(y, m + 1, 0).getDate(),
      start: new Date(y, m, 1).getDay(),
    };
  };

  const selectDate = (day) => {
    const selectedDate = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    if (selectedDate < today || isDateUnavailable(selectedDate)) return;

    const dateStr = formatDateLocal(selectedDate);
    setBookingData({
      ...bookingData,
      date: dateStr,
      startTime: "",
      endTime: "",
    });
    setShowCalendar(false);

    toast.success(`Selected ${formatDateDisplay(selectedDate)}`);
  };

  const isDateUnavailable = (date) => {
    const dateStr = formatDateLocal(date);
    return unavailableDates.has(dateStr);
  };

  const isPastDate = (day) => {
    const d = new Date(
      currentMonth.getFullYear(),
      currentMonth.getMonth(),
      day
    );
    return d < today;
  };

  const formatDateDisplay = (date) => {
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const formatSelectedDate = () => {
    if (!bookingData.date) return "Select date";
    return formatDateDisplay(new Date(bookingData.date));
  };

  // Generate time slots with 30-minute intervals
  const generateTimeSlots = (start, end, minStart = null) => {
    if (!start || !end) return [];

    const slots = [];
    let [startH, startM] = start.split(":").map(Number);
    let [endH, endM] = end.split(":").map(Number);

    if (minStart) {
      const [minH, minM] = minStart.split(":").map(Number);
      if (startH < minH || (startH === minH && startM < minM)) {
        startH = minH;
        startM = minM;
      }
    }

    while (startH < endH || (startH === endH && startM < endM)) {
      const hStr = String(startH).padStart(2, "0");
      const mStr = String(startM).padStart(2, "0");
      slots.push(`${hStr}:${mStr}`);

      // Add 30 minutes
      startM += 30;
      if (startM >= 60) {
        startH += 1;
        startM = 0;
      }
    }

    return slots;
  };

  const getOperatingHoursForDate = (date) => {
    if (!listing?.operatingHours) return null;

    const dayOfWeek = date.getDay();
    const dayNames = [
      "sunday",
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ];
    return listing.operatingHours[dayNames[dayOfWeek]];
  };

  const startSlots =
    bookingData.date && listing?.operatingHours
      ? generateTimeSlots(
          getOperatingHoursForDate(new Date(bookingData.date))?.start ||
            "09:00",
          getOperatingHoursForDate(new Date(bookingData.date))?.end || "21:00"
        )
      : [];

  const endSlots =
    bookingData.startTime && listing?.operatingHours
      ? generateTimeSlots(
          getOperatingHoursForDate(new Date(bookingData.date))?.start ||
            "09:00",
          getOperatingHoursForDate(new Date(bookingData.date))?.end || "21:00",
          bookingData.startTime
        ).filter((time) => {
          // Ensure minimum 1-hour booking
          const [startH, startM] = bookingData.startTime.split(":").map(Number);
          const [endH, endM] = time.split(":").map(Number);
          const startMinutes = startH * 60 + startM;
          const endMinutes = endH * 60 + endM;
          return endMinutes - startMinutes >= 60;
        })
      : [];

  const calculateDuration = () => {
    if (!bookingData.startTime || !bookingData.endTime) return 0;
    const [startH, startM] = bookingData.startTime.split(":").map(Number);
    const [endH, endM] = bookingData.endTime.split(":").map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return (endMinutes - startMinutes) / 60;
  };

  const calculateTotal = () => {
    const hours = calculateDuration();
    const basePrice = hours * (listing?.hourlyRate || listing?.price || 0);
    const guestSurcharge =
      Math.max(0, bookingData.guests - (listing?.includedGuests || 10)) *
      (listing?.extraGuestCharge || 0);
    return basePrice + guestSurcharge;
  };

  const validateBooking = () => {
    if (!user) {
      toast.error("Please login to book");
      router.push(`/login?redirect=/listings/${id}`);
      return false;
    }

    if (!bookingData.date) {
      toast.error("Please select a date");
      return false;
    }

    if (!bookingData.startTime || !bookingData.endTime) {
      toast.error("Please select start and end times");
      return false;
    }

    if (bookingData.guests > (listing?.capacity || 100)) {
      toast.error(`Maximum capacity is ${listing.capacity} guests`);
      return false;
    }

    if (bookingData.guests < (listing?.minCapacity || 1)) {
      toast.error(
        `Minimum ${listing.minCapacity} guest${
          listing.minCapacity > 1 ? "s" : ""
        } required`
      );
      return false;
    }

    return true;
  };

  const handleBooking = async () => {
    if (!validateBooking()) return;

    setIsBooking(true);

    try {
      // Calculate duration here to show in the request
      const duration = calculateDuration();

      const data = await api("/api/bookings", {
        method: "POST",
        body: {
          listingId: listing.id,
          userId: user.id,
          bookingDate: bookingData.date,
          startTime: bookingData.startTime,
          endTime: bookingData.endTime,
          guests: bookingData.guests,
          specialRequests: "", // Add this if you have special requests field
          // Don't send totalPrice - backend will calculate it
        },
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (data.error) throw new Error(data.error);

      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold">🎉 Booking Confirmed!</span>
          <span className="text-sm">Check your email for details</span>
        </div>,
        { duration: 4000 }
      );

      // Reset form
      setBookingData({
        date: "",
        startTime: "",
        endTime: "",
        guests: Math.max(1, listing?.minCapacity || 1),
      });

      // Navigate to bookings page after delay
      setTimeout(() => {
        router.push("/bookings");
      }, 2000);
    } catch (err) {
      console.error("Booking error:", err);
      toast.error(err.message || "Booking failed. Please try again.");
    } finally {
      setIsBooking(false);
    }
  };

  const nextImage = () => {
    if (listing?.images?.length) {
      setCurrentImageIndex((prev) => (prev + 1) % listing.images.length);
    }
  };

  const prevImage = () => {
    if (listing?.images?.length) {
      setCurrentImageIndex(
        (prev) => (prev - 1 + listing.images.length) % listing.images.length
      );
    }
  };

  const quickSelectGuests = (count) => {
    setBookingData({ ...bookingData, guests: count });
    setShowGuests(false);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, i) => (
          <svg
            key={i}
            className={`w-4 h-4 ${
              i < rating ? "text-yellow-400" : "text-gray-300"
            }`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        ))}
      </div>
    );
  };

  const ReviewItem = ({ review }) => {
    const [expanded, setExpanded] = useState(false);

    return (
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center">
              <span className="text-white font-bold text-sm">
                {review.user?.name?.charAt(0) || "U"}
              </span>
            </div>
            <div>
              <p className="font-semibold text-gray-900">
                {review.user?.name || "Anonymous"}
              </p>
              <p className="text-sm text-gray-500">
                {new Date(review.createdAt).toLocaleDateString("en-US", {
                  month: "long",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-1">
              {renderStars(review.rating)}
              <span className="text-lg font-bold text-gray-900 ml-2">
                {review.rating.toFixed(1)}
              </span>
            </div>
          </div>
        </div>

        {review.title && (
          <h4 className="text-lg font-bold text-gray-900 mb-2">
            {review.title}
          </h4>
        )}

        <p
          className={`text-gray-700 ${
            !expanded && review.comment.length > 300 ? "line-clamp-3" : ""
          }`}
        >
          {review.comment}
        </p>

        {review.comment.length > 300 && (
          <button
            onClick={() => setExpanded(!expanded)}
            className="text-emerald-600 hover:text-emerald-700 font-medium text-sm mt-2"
          >
            {expanded ? "Show less" : "Read more"}
          </button>
        )}

        {review.bookingDetails && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">
              Stayed on{" "}
              {new Date(review.bookingDetails.bookingDate).toLocaleDateString()}
              {review.bookingDetails.guests > 1 &&
                ` • ${review.bookingDetails.guests} guests`}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-stone-600 font-medium">
            Loading your experience...
          </p>
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
    <div className="min-h-screen bg-stone-50">
      <Toaster position="top-right" />

      {/* HERO SECTION */}
      <div
        ref={heroRef}
        className="relative h-[65vh] md:h-[75vh] bg-stone-900 overflow-hidden"
      >
        {listing.images?.length > 0 ? (
          <>
            <div className="absolute inset-0">
              <img
                src={listing.images[currentImageIndex].url}
                alt={listing.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
            </div>

            {/* Image Counter */}
            <div className="absolute top-6 right-6 bg-black/50 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium">
              {currentImageIndex + 1} / {listing.images.length}
            </div>

            {/* Navigation */}
            {listing.images.length > 1 && (
              <>
                <button
                  onClick={prevImage}
                  className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full flex items-center justify-center transition-all group"
                >
                  <svg
                    className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>
                <button
                  onClick={nextImage}
                  className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full flex items-center justify-center transition-all group"
                >
                  <svg
                    className="w-6 h-6 text-white group-hover:scale-110 transition-transform"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={3}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </>
            )}
          </>
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500" />
        )}

        {/* Content Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-12">
          <div className="max-w-7xl mx-auto">
            <button
              onClick={() => router.back()}
              className="mb-6 inline-flex items-center gap-2 text-white/90 hover:text-white font-medium transition-colors group"
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
              Back to listings
            </button>

            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div className="max-w-3xl">
                <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-3 py-1 rounded-full text-sm font-medium mb-4">
                  <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse"></span>
                  Available now
                </div>

                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-4 leading-tight">
                  {listing.title}
                </h1>

                <div className="flex flex-wrap items-center gap-4 text-white/90">
                  <div className="flex items-center gap-2">
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
                        d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                      />
                    </svg>
                    <span className="font-medium">{listing.location}</span>
                  </div>

                  {reviewStats.total > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="flex items-center">
                        {renderStars(reviewStats.average)}
                      </div>
                      <span className="font-medium">
                        {reviewStats.average.toFixed(1)} ({reviewStats.total}{" "}
                        reviews)
                      </span>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
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
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="font-medium">1 hr minimum</span>
                  </div>

                  {listing.capacity && (
                    <div className="flex items-center gap-2">
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
                          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                        />
                      </svg>
                      <span className="font-medium">
                        Up to {listing.capacity} guests
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FLOATING BOOKING BAR */}
      {showFloatingBar && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg z-50 transform transition-transform duration-300">
          <div className="max-w-7xl mx-auto px-6 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-6">
                <div>
                  <p className="text-sm text-stone-500">Total</p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ${calculateTotal()}
                  </p>
                </div>
                <div className="hidden md:flex items-center gap-4">
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-stone-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span className="text-sm">
                      {bookingData.date ? formatSelectedDate() : "Select date"}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <svg
                      className="w-4 h-4 text-stone-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span className="text-sm">
                      {bookingData.startTime && bookingData.endTime
                        ? `${bookingData.startTime} - ${bookingData.endTime}`
                        : "Select time"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleBooking}
                disabled={
                  !bookingData.date ||
                  !bookingData.startTime ||
                  !bookingData.endTime ||
                  isBooking
                }
                className={`px-8 py-3 rounded-xl font-bold transition-all ${
                  !bookingData.date ||
                  !bookingData.startTime ||
                  !bookingData.endTime ||
                  isBooking
                    ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                    : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl"
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
          {/* LEFT COLUMN - Details */}
          <div className="lg:col-span-2 space-y-12">
            {/* Navigation Tabs */}
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
                  {/* Host Card */}
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <div className="flex items-center gap-4">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 flex items-center justify-center flex-shrink-0">
                        {listing.host?.profilePhoto ? (
                          <img
                            src={listing.host.profilePhoto}
                            alt={listing.host.name}
                            className="w-full h-full object-cover rounded-full"
                          />
                        ) : (
                          <span className="text-white font-black text-2xl">
                            {listing.host?.name?.charAt(0) || "H"}
                          </span>
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-stone-500 font-medium">
                          Hosted by
                        </p>
                        <p className="text-xl font-bold text-stone-900 mb-1">
                          {listing.host?.name || "Host"}
                        </p>
                        <div className="flex items-center gap-2">
                          {renderStars(4.9)}
                          <span className="text-sm text-stone-600">
                            4.9 • Superhost
                          </span>
                        </div>
                      </div>
                      <button className="px-4 py-2 border border-emerald-600 text-emerald-600 rounded-lg hover:bg-emerald-50 transition-colors">
                        Contact Host
                      </button>
                    </div>
                  </div>

                  {/* Description */}
                  <div>
                    <h2 className="text-3xl font-bold text-stone-900 mb-4">
                      About this space
                    </h2>
                    <div className="prose prose-lg max-w-none">
                      <p className="text-stone-700 leading-relaxed whitespace-pre-line">
                        {listing.description || "No description available."}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "amenities" && listing.amenities?.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {listing.amenities.map((amenity, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-4 p-4 bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow"
                    >
                      <div className="w-12 h-12 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                        <svg
                          className="w-6 h-6 text-emerald-600"
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
                      <span className="font-medium text-stone-800">
                        {amenity}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {activeTab === "location" && listing.location && (
                <div className="space-y-6">
                  <div className="bg-white rounded-2xl p-6 shadow-lg">
                    <h3 className="text-xl font-bold text-stone-900 mb-4">
                      Location
                    </h3>
                    <p className="text-stone-700 mb-4">{listing.location}</p>
                    <div className="h-64 bg-stone-200 rounded-lg flex items-center justify-center">
                      <span className="text-stone-500">
                        Map view would appear here
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === "reviews" && (
                <div className="space-y-8">
                  {/* Reviews Header with Stats */}
                  <div className="bg-white rounded-2xl p-8 shadow-lg">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                      <div>
                        <h2 className="text-3xl font-bold text-stone-900 mb-2">
                          {reviewStats.average.toFixed(1)} out of 5
                        </h2>
                        <div className="flex items-center gap-2 mb-1">
                          {renderStars(reviewStats.average)}
                          <span className="text-stone-600">
                            ({reviewStats.total} reviews)
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2">
                        {/* In the Reviews Header with Stats section */}
                        {checkingReviewEligibility ? (
                          <div className="px-6 py-3 bg-stone-100 text-stone-600 font-bold rounded-lg border border-stone-200 flex items-center gap-2">
                            <div className="w-4 h-4 border-2 border-stone-400 border-t-transparent rounded-full animate-spin" />
                            Checking eligibility...
                          </div>
                        ) : canUserReview && !userReview ? (
                          <button
                            onClick={() => {
                              // Redirect to the new review page
                              router.push(
                                `/reviews/new/${id}${
                                  eligibleBookingId
                                    ? `?bookingId=${eligibleBookingId}`
                                    : ""
                                }`
                              );
                            }}
                            className="px-6 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold rounded-lg hover:shadow-lg transition-all hover:scale-105 active:scale-95"
                          >
                            ✍️ Leave a Review
                          </button>
                        ) : userReview ? (
                          <div className="flex flex-col gap-2 items-end">
                            <div className="px-6 py-3 bg-emerald-50 text-emerald-700 font-bold rounded-lg border border-emerald-200">
                              ✅ You've reviewed this space
                            </div>
                          </div>
                        ) : user ? (
                          <div className="flex flex-col gap-2 items-end">
                            <div className="px-6 py-3 bg-amber-50 text-amber-700 font-bold rounded-lg border border-amber-200 flex items-center gap-2">
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
                                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"
                                />
                              </svg>
                              Cannot Review
                            </div>
                            <p className="text-sm text-stone-500 text-right">
                              {reviewEligibilityReason ||
                                "Complete a booking to review"}
                            </p>
                          </div>
                        ) : (
                          <div className="flex flex-col gap-2 items-end">
                            <div className="px-6 py-3 bg-blue-50 text-blue-700 font-bold rounded-lg border border-blue-200 flex items-center gap-2">
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
                                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                                />
                              </svg>
                              Login to review
                            </div>
                            <button
                              onClick={() =>
                                router.push(`/login?redirect=/listings/${id}`)
                              }
                              className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                            >
                              Sign in →
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Review Requirements Banner - Moved to be more prominent */}
                    {user &&
                      !canUserReview &&
                      !userReview &&
                      !checkingReviewEligibility && (
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 mb-8">
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center flex-shrink-0">
                                <svg
                                  className="w-6 h-6 text-white"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                              </div>
                              <div>
                                <h4 className="font-bold text-blue-900 text-lg mb-1">
                                  Ready to leave a review?
                                </h4>
                                <p className="text-blue-700">
                                  Book this space, complete your stay, and share
                                  your experience to help others.
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() => {
                                // Scroll to booking section
                                document
                                  .querySelector(".sticky")
                                  .scrollIntoView({ behavior: "smooth" });
                              }}
                              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-lg hover:shadow-lg transition-all whitespace-nowrap"
                            >
                              Book Now to Review
                            </button>
                          </div>

                          <div className="mt-6 pt-6 border-t border-blue-200">
                            <h5 className="text-sm font-bold text-blue-800 mb-3 flex items-center gap-2">
                              <svg
                                className="w-4 h-4"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Review Requirements
                            </h5>
                            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <li className="flex items-center gap-3 text-sm text-blue-700">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-blue-600 font-bold text-xs">
                                    1
                                  </span>
                                </div>
                                <span>Complete a booking for this listing</span>
                              </li>
                              <li className="flex items-center gap-3 text-sm text-blue-700">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-blue-600 font-bold text-xs">
                                    2
                                  </span>
                                </div>
                                <span>
                                  Wait for booking to be marked as "COMPLETED"
                                </span>
                              </li>
                              <li className="flex items-center gap-3 text-sm text-blue-700">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-blue-600 font-bold text-xs">
                                    3
                                  </span>
                                </div>
                                <span>Review within 30 days of completion</span>
                              </li>
                              <li className="flex items-center gap-3 text-sm text-blue-700">
                                <div className="w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                                  <span className="text-blue-600 font-bold text-xs">
                                    4
                                  </span>
                                </div>
                                <span>
                                  Only one review per completed booking
                                </span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      )}

                    {/* Rating Distribution */}
                    {reviewStats.total > 0 && (
                      <div className="space-y-4">
                        <h4 className="text-lg font-bold text-stone-900">
                          Rating Breakdown
                        </h4>
                        {[5, 4, 3, 2, 1].map((stars) => {
                          const count = reviewStats.distribution[stars] || 0;
                          const percentage =
                            reviewStats.total > 0
                              ? (count / reviewStats.total) * 100
                              : 0;

                          return (
                            <div
                              key={stars}
                              className="flex items-center gap-3"
                            >
                              <span className="text-sm font-medium text-stone-600 w-12">
                                {stars} {stars === 1 ? "star" : "stars"}
                              </span>
                              <div className="flex-1">
                                <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-emerald-400 to-teal-500"
                                    style={{ width: `${percentage}%` }}
                                  />
                                </div>
                              </div>
                              <span className="text-sm text-stone-600 w-12 text-right">
                                {count}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>

                  {/* Review Form Modal - keep existing code */}
                  {/* Review Form Modal */}
                  {showReviewForm && (
                    <div className="fixed inset-0 z-[100]">
                      {/* Backdrop with blur */}
                      <div
                        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                        onClick={() => {
                          setShowReviewForm(false);
                          if (!userReview) {
                            setReviewForm({
                              rating: 0,
                              title: "",
                              comment: "",
                              cleanliness: 5,
                              accuracy: 5,
                              communication: 5,
                              location: 5,
                              checkin: 5,
                              value: 5,
                            });
                          }
                        }}
                      />

                      {/* Modal Content */}
                      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6">
                        <div
                          ref={reviewFormRef}
                          className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] shadow-2xl animate-in fade-in-0 zoom-in-95 duration-200 flex flex-col"
                        >
                          {/* Header */}
                          <div className="p-6 border-b border-stone-200 bg-gradient-to-r from-emerald-50 to-teal-50">
                            <div className="flex items-center justify-between">
                              <div>
                                <h3 className="text-2xl font-bold text-stone-900">
                                  {userReview
                                    ? "Edit Your Review"
                                    : "listingpage"}
                                </h3>
                                <p className="text-stone-600 mt-1">
                                  Share your experience to help others decide
                                </p>
                              </div>
                              <button
                                onClick={() => {
                                  setShowReviewForm(false);
                                  if (!userReview) {
                                    setReviewForm({
                                      rating: 0,
                                      title: "",
                                      comment: "",
                                      cleanliness: 5,
                                      accuracy: 5,
                                      communication: 5,
                                      location: 5,
                                      checkin: 5,
                                      value: 5,
                                    });
                                  }
                                }}
                                className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                                aria-label="Close"
                              >
                                <svg
                                  className="w-6 h-6 text-stone-500"
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
                            </div>
                          </div>

                          {/* Form Content - Scrollable area */}
                          <div className="flex-1 overflow-y-auto">
                            <div className="p-6 space-y-6">
                              {/* Overall Rating */}
                              <div>
                                <label className="block text-lg font-bold text-stone-900 mb-3">
                                  Overall Rating *
                                </label>
                                <div className="flex items-center gap-2">
                                  {[1, 2, 3, 4, 5].map((star) => (
                                    <button
                                      key={star}
                                      type="button"
                                      onClick={() =>
                                        setReviewForm((prev) => ({
                                          ...prev,
                                          rating: star,
                                        }))
                                      }
                                      className="text-5xl focus:outline-none hover:scale-110 transition-transform duration-150"
                                    >
                                      <span
                                        className={
                                          star <= reviewForm.rating
                                            ? "text-yellow-400"
                                            : "text-stone-300"
                                        }
                                      >
                                        ★
                                      </span>
                                    </button>
                                  ))}
                                  <span className="text-2xl font-bold text-stone-700 ml-4">
                                    {reviewForm.rating}.0
                                  </span>
                                </div>
                                <p className="text-sm text-stone-500 mt-2">
                                  How would you rate your overall experience?
                                </p>
                              </div>

                              {/* Review Title */}
                              <div>
                                <label className="block text-sm font-bold text-stone-900 mb-2">
                                  Review Title (Optional)
                                </label>
                                <input
                                  type="text"
                                  value={reviewForm.title}
                                  onChange={(e) =>
                                    setReviewForm((prev) => ({
                                      ...prev,
                                      title: e.target.value,
                                    }))
                                  }
                                  placeholder="Summarize your experience in a few words"
                                  className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                                  maxLength={100}
                                />
                                <div className="text-right text-sm text-stone-500 mt-1">
                                  {reviewForm.title.length}/100 characters
                                </div>
                              </div>

                              {/* Review Comment */}
                              <div>
                                <label className="block text-sm font-bold text-stone-900 mb-2">
                                  Your Review *
                                </label>
                                <textarea
                                  value={reviewForm.comment}
                                  onChange={(e) =>
                                    setReviewForm((prev) => ({
                                      ...prev,
                                      comment: e.target.value,
                                    }))
                                  }
                                  placeholder="Share details about your experience, what you liked, and what could be improved..."
                                  className="w-full p-3 border border-stone-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all resize-none h-40"
                                  maxLength={2000}
                                  required
                                />
                                <div className="flex justify-between items-center mt-1">
                                  <p className="text-sm text-stone-500">
                                    Be specific and helpful for other guests
                                  </p>
                                  <div className="text-sm text-stone-500">
                                    {reviewForm.comment.length}/2000 characters
                                  </div>
                                </div>
                              </div>

                              {/* Category Ratings (Optional - can be collapsed) */}
                              <div className="border-t border-stone-200 pt-6">
                                <details className="group">
                                  <summary className="flex items-center justify-between cursor-pointer list-none">
                                    <span className="text-lg font-bold text-stone-900">
                                      Category Ratings (Optional)
                                    </span>
                                    <svg
                                      className="w-5 h-5 text-stone-500 group-open:rotate-180 transition-transform"
                                      fill="none"
                                      viewBox="0 0 24 24"
                                      stroke="currentColor"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 9l-7 7-7-7"
                                      />
                                    </svg>
                                  </summary>
                                  <div className="mt-4 space-y-4">
                                    {[
                                      {
                                        key: "cleanliness",
                                        label: "Cleanliness",
                                        value: reviewForm.cleanliness,
                                      },
                                      {
                                        key: "accuracy",
                                        label: "Accuracy",
                                        value: reviewForm.accuracy,
                                      },
                                      {
                                        key: "communication",
                                        label: "Communication",
                                        value: reviewForm.communication,
                                      },
                                      {
                                        key: "location",
                                        label: "Location",
                                        value: reviewForm.location,
                                      },
                                      {
                                        key: "checkin",
                                        label: "Check-in",
                                        value: reviewForm.checkin,
                                      },
                                      {
                                        key: "value",
                                        label: "Value",
                                        value: reviewForm.value,
                                      },
                                    ].map(({ key, label, value }) => (
                                      <div key={key} className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <label className="text-sm font-medium text-stone-700">
                                            {label}
                                          </label>
                                          <span className="text-sm font-bold text-stone-900">
                                            {value}/5
                                          </span>
                                        </div>
                                        <div className="flex gap-1">
                                          {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                              key={star}
                                              type="button"
                                              onClick={() =>
                                                setReviewForm((prev) => ({
                                                  ...prev,
                                                  [key]: star,
                                                }))
                                              }
                                              className="text-2xl focus:outline-none hover:scale-110 transition-transform"
                                            >
                                              <span
                                                className={
                                                  star <= value
                                                    ? "text-yellow-400"
                                                    : "text-stone-300"
                                                }
                                              >
                                                ★
                                              </span>
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </details>
                              </div>

                              {/* Bottom spacing for better scroll feel */}
                              <div className="h-6"></div>
                            </div>
                          </div>

                          {/* Footer with Actions - Fixed at bottom */}
                          <div className="p-6 border-t border-stone-200 bg-stone-50">
                            <div className="flex flex-col sm:flex-row gap-3">
                              <button
                                onClick={() => {
                                  setShowReviewForm(false);
                                  if (!userReview) {
                                    setReviewForm({
                                      rating: 0,
                                      title: "",
                                      comment: "",
                                      cleanliness: 5,
                                      accuracy: 5,
                                      communication: 5,
                                      location: 5,
                                      checkin: 5,
                                      value: 5,
                                    });
                                  }
                                }}
                                className="px-6 py-3 border border-stone-300 text-stone-700 font-bold rounded-lg hover:bg-stone-100 transition-colors flex-1"
                              >
                                Cancel
                              </button>
                              <button
                                onClick={handleSubmitReview}
                                disabled={
                                  submittingReview ||
                                  reviewForm.rating === 0 ||
                                  !reviewForm.comment.trim()
                                }
                                className={`px-6 py-3 font-bold rounded-lg transition-all flex-1 ${
                                  submittingReview ||
                                  reviewForm.rating === 0 ||
                                  !reviewForm.comment.trim()
                                    ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                                    : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white hover:shadow-lg"
                                }`}
                              >
                                {submittingReview ? (
                                  <span className="flex items-center justify-center gap-2">
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Submitting...
                                  </span>
                                ) : userReview ? (
                                  "Update Review"
                                ) : (
                                  "Submit Review"
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Reviews List */}
                  {reviews.length > 0 ? (
                    <div className="space-y-6">
                      <h3 className="text-2xl font-bold text-stone-900">
                        Guest Reviews ({reviewStats.total})
                      </h3>
                      <div className="grid grid-cols-1 gap-6">
                        {reviews.map((review) => (
                          <ReviewItem key={review.id} review={review} />
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 bg-white rounded-2xl shadow-sm border border-stone-100">
                      <div className="w-24 h-24 mx-auto mb-6 text-stone-200">
                        <svg
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1}
                            d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                          />
                        </svg>
                      </div>
                      <h3 className="text-2xl font-bold text-stone-900 mb-2">
                        No reviews yet
                      </h3>
                      <p className="text-stone-600 max-w-md mx-auto mb-6">
                        Be the first to share your experience! Complete a
                        booking to leave a review.
                      </p>
                      <button
                        onClick={() => {
                          document
                            .querySelector(".sticky")
                            .scrollIntoView({ behavior: "smooth" });
                        }}
                        className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold px-6 py-3 rounded-xl hover:shadow-lg transition-all"
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
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Book Now to Be the First Reviewer
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* RIGHT COLUMN - Booking Card */}
          <div className="lg:col-span-1">
            <div className="sticky top-8">
              <div className="bg-white rounded-2xl shadow-2xl border border-stone-200 ">
                {/* Price Header */}
                <div className="p-6 border-b border-stone-200">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl font-bold text-stone-900">
                      ${listing.hourlyRate || listing.price}
                    </span>
                    <span className="text-stone-600">/ hour</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-stone-600">
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <span>Free cancellation up to 24 hours</span>
                  </div>
                </div>

                {/* Booking Form */}
                <div className="p-6 space-y-4">
                  {/* Date Picker */}
                  <div ref={calendarRef} className="relative">
                    <label className="block text-sm font-bold text-stone-900 mb-2">
                      📅 Date
                      {checkingAvailability && (
                        <span className="ml-2 text-xs text-emerald-600 animate-pulse">
                          Checking availability...
                        </span>
                      )}
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowCalendar(!showCalendar);
                        setShowTimeSlots(false);
                        setShowGuests(false);
                      }}
                      className={`w-full p-4 rounded-xl text-left font-medium transition-all border ${
                        bookingData.date
                          ? "border-emerald-500 bg-emerald-50"
                          : "border-stone-200 hover:border-emerald-400 bg-white"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={
                            bookingData.date
                              ? "text-emerald-700"
                              : "text-stone-600"
                          }
                        >
                          {bookingData.date
                            ? formatSelectedDate()
                            : "Select date"}
                        </span>
                        <svg
                          className="w-5 h-5 text-stone-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                    </button>

                    {showCalendar && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-stone-200 p-4 z-50">
                        <div className="flex items-center justify-between mb-4">
                          <button
                            onClick={() =>
                              setCurrentMonth(
                                new Date(
                                  currentMonth.getFullYear(),
                                  currentMonth.getMonth() - 1
                                )
                              )
                            }
                            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                          >
                            <svg
                              className="w-5 h-5 text-stone-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15 19l-7-7 7-7"
                              />
                            </svg>
                          </button>
                          <div className="font-bold text-stone-900">
                            {MONTHS[currentMonth.getMonth()]}{" "}
                            {currentMonth.getFullYear()}
                          </div>
                          <button
                            onClick={() =>
                              setCurrentMonth(
                                new Date(
                                  currentMonth.getFullYear(),
                                  currentMonth.getMonth() + 1
                                )
                              )
                            }
                            className="p-2 hover:bg-stone-100 rounded-lg transition-colors"
                          >
                            <svg
                              className="w-5 h-5 text-stone-600"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 5l7 7-7 7"
                              />
                            </svg>
                          </button>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {DAYS.map((d, i) => (
                            <div
                              key={i}
                              className="text-center text-xs font-bold text-stone-500 py-2"
                            >
                              {d}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {[...Array(daysInMonth().start)].map((_, i) => (
                            <div key={`empty-${i}`} />
                          ))}
                          {[...Array(daysInMonth().days)].map((_, i) => {
                            const day = i + 1;
                            const date = new Date(
                              currentMonth.getFullYear(),
                              currentMonth.getMonth(),
                              day
                            );
                            const past = isPastDate(day);
                            const unavailable = isDateUnavailable(date);
                            const selected =
                              bookingData.date === formatDateLocal(date);
                            const isToday =
                              date.toDateString() === today.toDateString();

                            return (
                              <button
                                key={day}
                                onClick={() => selectDate(day)}
                                disabled={past || unavailable}
                                className={`aspect-square flex items-center justify-center text-sm font-medium rounded-lg transition-all relative
                                  ${
                                    past
                                      ? "text-stone-300 cursor-not-allowed"
                                      : ""
                                  }
                                  ${
                                    unavailable
                                      ? "text-stone-300 cursor-not-allowed line-through"
                                      : ""
                                  }
                                  ${
                                    selected
                                      ? "bg-emerald-500 text-white"
                                      : !past && !unavailable
                                      ? "hover:bg-emerald-50 text-stone-800"
                                      : ""
                                  }
                                `}
                                title={unavailable ? "Unavailable" : ""}
                              >
                                {day}
                                {isToday && !selected && (
                                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                                )}
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Time Slots */}
                  <div ref={timeSlotsRef} className="relative">
                    <label className="block text-sm font-bold text-stone-900 mb-2">
                      ⏰ Time
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowTimeSlots(
                              showTimeSlots === "start" ? false : "start"
                            );
                            setShowCalendar(false);
                            setShowGuests(false);
                          }}
                          className={`w-full p-3 rounded-lg font-medium text-sm transition-all border ${
                            bookingData.startTime
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : "border-stone-200 hover:border-emerald-400 text-stone-600"
                          }`}
                        >
                          {bookingData.startTime || "Start time"}
                        </button>
                      </div>
                      <div>
                        <button
                          type="button"
                          onClick={() => {
                            setShowTimeSlots(
                              showTimeSlots === "end" ? false : "end"
                            );
                            setShowCalendar(false);
                            setShowGuests(false);
                          }}
                          disabled={!bookingData.startTime}
                          className={`w-full p-3 rounded-lg font-medium text-sm transition-all border ${
                            bookingData.endTime
                              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                              : !bookingData.startTime
                              ? "border-stone-100 bg-stone-50 text-stone-400 cursor-not-allowed"
                              : "border-stone-200 hover:border-emerald-400 text-stone-600"
                          }`}
                        >
                          {bookingData.endTime || "End time"}
                        </button>
                      </div>
                    </div>

                    {showTimeSlots &&
                      (showTimeSlots === "start" ? startSlots : endSlots)
                        .length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-stone-200 p-4 z-50 max-h-80 overflow-y-auto">
                          <div className="grid grid-cols-3 gap-2">
                            {(showTimeSlots === "start"
                              ? startSlots
                              : endSlots
                            ).map((time) => (
                              <button
                                key={time}
                                onClick={() => {
                                  setBookingData((prev) => ({
                                    ...prev,
                                    [showTimeSlots === "start"
                                      ? "startTime"
                                      : "endTime"]: time,
                                    ...(showTimeSlots === "start"
                                      ? { endTime: "" }
                                      : {}),
                                  }));
                                  setShowTimeSlots(false);
                                }}
                                className="p-2 text-sm font-medium text-stone-700 hover:bg-emerald-50 hover:text-emerald-700 rounded-lg transition-colors"
                              >
                                {time}
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>

                  {/* Guests */}
                  <div ref={guestsRef} className="relative">
                    <label className="block text-sm font-bold text-stone-900 mb-2">
                      👥 Guests
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setShowGuests(!showGuests);
                        setShowCalendar(false);
                        setShowTimeSlots(false);
                      }}
                      className="w-full p-4 rounded-xl text-left font-medium transition-all border border-stone-200 hover:border-emerald-400 bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-stone-700">
                          {bookingData.guests} guest
                          {bookingData.guests !== 1 ? "s" : ""}
                        </span>
                        <svg
                          className="w-5 h-5 text-stone-400"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </button>

                    {showGuests && (
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-stone-200 p-6 z-50">
                        <div className="mb-4">
                          <p className="text-sm text-stone-600 mb-3">
                            Quick select:
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {[1, 2, 4, 6, 8, 10].map((count) => (
                              <button
                                key={count}
                                onClick={() => quickSelectGuests(count)}
                                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                                  bookingData.guests === count
                                    ? "bg-emerald-500 text-white"
                                    : "bg-stone-100 text-stone-700 hover:bg-stone-200"
                                }`}
                              >
                                {count} {count === 1 ? "guest" : "guests"}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 bg-stone-50 rounded-lg">
                          <button
                            onClick={() =>
                              setBookingData((prev) => ({
                                ...prev,
                                guests: Math.max(
                                  listing.minCapacity || 1,
                                  prev.guests - 1
                                ),
                              }))
                            }
                            disabled={
                              bookingData.guests <= (listing.minCapacity || 1)
                            }
                            className="w-10 h-10 rounded-full bg-white border border-stone-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors"
                          >
                            <span className="text-xl">−</span>
                          </button>
                          <div className="text-center">
                            <div className="text-3xl font-bold text-stone-900">
                              {bookingData.guests}
                            </div>
                            <div className="text-sm text-stone-600">guests</div>
                          </div>
                          <button
                            onClick={() =>
                              setBookingData((prev) => ({
                                ...prev,
                                guests: Math.min(
                                  listing.capacity || 100,
                                  prev.guests + 1
                                ),
                              }))
                            }
                            disabled={
                              bookingData.guests >= (listing.capacity || 100)
                            }
                            className="w-10 h-10 rounded-full bg-white border border-stone-300 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-stone-50 transition-colors"
                          >
                            <span className="text-xl">+</span>
                          </button>
                        </div>

                        {listing.capacity && (
                          <p className="text-xs text-stone-500 text-center mt-4">
                            Maximum capacity: {listing.capacity} guests
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Price Breakdown */}
                  {calculateDuration() > 0 && (
                    <div className="pt-4 border-t border-stone-200 space-y-3">
                      <div className="flex justify-between text-sm">
                        <span className="text-stone-600">
                          ${listing.hourlyRate || listing.price} ×{" "}
                          {calculateDuration()} hours
                        </span>
                        <span className="font-medium">
                          $
                          {(listing.hourlyRate || listing.price) *
                            calculateDuration()}
                        </span>
                      </div>

                      {listing.extraGuestCharge &&
                        bookingData.guests > (listing.includedGuests || 10) && (
                          <div className="flex justify-between text-sm">
                            <span className="text-stone-600">
                              Extra guests (${listing.extraGuestCharge} each)
                            </span>
                            <span className="font-medium">
                              $
                              {(bookingData.guests -
                                (listing.includedGuests || 10)) *
                                listing.extraGuestCharge}
                            </span>
                          </div>
                        )}

                      <div className="flex justify-between text-lg font-bold pt-3 border-t border-stone-200">
                        <span>Total</span>
                        <span className="text-emerald-600">
                          ${calculateTotal()}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Book Button */}
                  <button
                    onClick={handleBooking}
                    disabled={
                      !bookingData.date ||
                      !bookingData.startTime ||
                      !bookingData.endTime ||
                      isBooking
                    }
                    className={`w-full py-4 rounded-xl font-bold text-lg transition-all ${
                      !bookingData.date ||
                      !bookingData.startTime ||
                      !bookingData.endTime ||
                      isBooking
                        ? "bg-stone-200 text-stone-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
                    }`}
                  >
                    {isBooking ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </span>
                    ) : (
                      "Reserve Now"
                    )}
                  </button>

                  {/* Security Message */}
                  <div className="text-center pt-4">
                    <div className="flex items-center justify-center gap-2 text-sm text-stone-500 mb-2">
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                      <span>Your payment is secured with encryption</span>
                    </div>
                    <p className="text-xs text-stone-400">
                      You won't be charged until the host confirms your booking
                    </p>
                  </div>
                </div>
              </div>

              {/* Safety Guidelines */}
              <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
                <h4 className="font-bold text-amber-800 mb-2 flex items-center gap-2">
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
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.346 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  Safety Guidelines
                </h4>
                <ul className="text-sm text-amber-700 space-y-1">
                  <li>• Follow host's house rules</li>
                  <li>• No smoking unless permitted</li>
                  <li>• Respect the space and neighbors</li>
                  <li>• Leave the space as you found it</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
