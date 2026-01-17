// services/fraudDetectionService.js
export async function checkForFraud(bookingData, userData) {
  const riskFactors = [];
  
  // Check booking patterns
  const userBookings = await getRecentUserBookings(userData.id);
  if (userBookings.length === 0 && bookingData.totalPrice > 1000) {
    riskFactors.push('HIGH_VALUE_FIRST_BOOKING');
  }

  // Check IP address
  const ipReputation = await checkIPReputation(bookingData.ipAddress);
  if (ipReputation.riskScore > 70) {
    riskFactors.push('SUSPICIOUS_IP');
  }

  // Check device fingerprint
  const deviceHistory = await checkDeviceHistory(bookingData.deviceFingerprint);
  if (deviceHistory.suspiciousActivity) {
    riskFactors.push('SUSPICIOUS_DEVICE');
  }

  // Velocity check
  const bookingVelocity = await checkBookingVelocity(userData.id);
  if (bookingVelocity > 3) { // More than 3 bookings in 24h
    riskFactors.push('HIGH_VELOCITY');
  }

  const riskScore = calculateRiskScore(riskFactors);
  
  return {
    riskScore,
    riskFactors,
    shouldReview: riskScore > 60,
    shouldBlock: riskScore > 85,
    recommendations: getRiskRecommendations(riskFactors)
  };
}