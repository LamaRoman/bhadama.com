// services/webhookService.js
export async function triggerWebhooks(eventType, data) {
  const webhooks = await getActiveWebhooks(eventType);
  
  for (const webhook of webhooks) {
    try {
      await axios.post(webhook.url, {
        event: eventType,
        data,
        timestamp: new Date().toISOString(),
        signature: generateSignature(data, webhook.secret)
      });
      
      await logWebhookDelivery(webhook.id, true);
    } catch (error) {
      await logWebhookDelivery(webhook.id, false, error.message);
    }
  }
}

// Trigger in booking controller
await triggerWebhooks('BOOKING_CREATED', {
  bookingId: booking.id,
  listingId: booking.listingId,
  userId: booking.userId,
  totalPrice: booking.totalPrice
});