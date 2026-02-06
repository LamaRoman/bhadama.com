// backend/services/notification/templates/defaultTemplates.js
// Default notification templates - seed this to database

export const DEFAULT_TEMPLATES = [
  // ============================================
  // BOOKING CONFIRMED
  // ============================================
  {
    slug: 'booking_confirmed',
    type: 'BOOKING_CONFIRMED',
    channel: 'EMAIL',
    language: 'en',
    subject: 'Booking Confirmed - {{listingTitle}}',
    title: 'Booking Confirmed! 🎉',
    body: `Hi {{userName}},

Great news! Your booking has been confirmed.

**Booking Details:**
- Booking #: {{bookingNumber}}
- Venue: {{listingTitle}}
- Date: {{bookingDate}}
- Time: {{startTime}} - {{endTime}}
- Guests: {{guests}}
- Total: {{totalPrice}}

**Venue Address:**
{{listingAddress}}

**Host Contact:**
{{hostName}} - {{hostPhone}}

Please arrive 10 minutes early. If you need to make changes, please contact the host directly.

See you there!
The {{appName}} Team`,
    variables: ['userName', 'bookingNumber', 'listingTitle', 'bookingDate', 'startTime', 'endTime', 'guests', 'totalPrice', 'listingAddress', 'hostName', 'hostPhone', 'appName'],
  },
  {
    slug: 'booking_confirmed',
    type: 'BOOKING_CONFIRMED',
    channel: 'SMS',
    language: 'en',
    title: 'Booking Confirmed',
    body: `{{appName}}: Booking confirmed! {{listingTitle}} on {{bookingDate}}, {{startTime}}-{{endTime}}. Booking #{{bookingNumber}}`,
    variables: ['appName', 'listingTitle', 'bookingDate', 'startTime', 'endTime', 'bookingNumber'],
  },
  {
    slug: 'booking_confirmed',
    type: 'BOOKING_CONFIRMED',
    channel: 'IN_APP',
    language: 'en',
    title: 'Booking Confirmed! 🎉',
    body: `Your booking at {{listingTitle}} for {{bookingDate}} has been confirmed.`,
    variables: ['listingTitle', 'bookingDate'],
  },

  // ============================================
  // NEW BOOKING REQUEST (For Host)
  // ============================================
  {
    slug: 'new_booking_request',
    type: 'NEW_BOOKING_REQUEST',
    channel: 'EMAIL',
    language: 'en',
    subject: 'New Booking - {{listingTitle}}',
    title: 'You have a new booking! 🎉',
    body: `Hi {{hostName}},

Great news! You have a new booking.

**Booking Details:**
- Booking #: {{bookingNumber}}
- Venue: {{listingTitle}}
- Date: {{bookingDate}}
- Time: {{startTime}} - {{endTime}}
- Guests: {{guests}}
- Amount: {{totalPrice}}

**Guest:**
{{guestName}}
{{guestPhone}}
{{guestEmail}}

Log in to your dashboard to view the full details.

{{appName}} Team`,
    variables: ['hostName', 'bookingNumber', 'listingTitle', 'bookingDate', 'startTime', 'endTime', 'guests', 'totalPrice', 'guestName', 'guestPhone', 'guestEmail', 'appName'],
  },
  {
    slug: 'new_booking_request',
    type: 'NEW_BOOKING_REQUEST',
    channel: 'SMS',
    language: 'en',
    title: 'New Booking',
    body: `{{appName}}: New booking for {{listingTitle}} on {{bookingDate}}, {{startTime}}-{{endTime}}. {{guests}} guests. {{totalPrice}}`,
    variables: ['appName', 'listingTitle', 'bookingDate', 'startTime', 'endTime', 'guests', 'totalPrice'],
  },
  {
    slug: 'new_booking_request',
    type: 'NEW_BOOKING_REQUEST',
    channel: 'IN_APP',
    language: 'en',
    title: 'New Booking! 🎉',
    body: `You have a new booking for {{listingTitle}} on {{bookingDate}}.`,
    variables: ['listingTitle', 'bookingDate'],
  },

  // ============================================
  // BOOKING CANCELLED
  // ============================================
  {
    slug: 'booking_cancelled',
    type: 'BOOKING_CANCELLED',
    channel: 'EMAIL',
    language: 'en',
    subject: 'Booking Cancelled - {{listingTitle}}',
    title: 'Booking Cancelled',
    body: `Hi {{userName}},

Your booking has been cancelled.

**Cancelled Booking:**
- Booking #: {{bookingNumber}}
- Venue: {{listingTitle}}
- Date: {{bookingDate}}
- Time: {{startTime}} - {{endTime}}

**Reason:** {{cancellationReason}}

If you have any questions, please contact our support team.

{{appName}} Team`,
    variables: ['userName', 'bookingNumber', 'listingTitle', 'bookingDate', 'startTime', 'endTime', 'cancellationReason', 'appName'],
  },
  {
    slug: 'booking_cancelled',
    type: 'BOOKING_CANCELLED',
    channel: 'SMS',
    language: 'en',
    title: 'Booking Cancelled',
    body: `{{appName}}: Your booking #{{bookingNumber}} for {{listingTitle}} on {{bookingDate}} has been cancelled.`,
    variables: ['appName', 'bookingNumber', 'listingTitle', 'bookingDate'],
  },
  {
    slug: 'booking_cancelled',
    type: 'BOOKING_CANCELLED',
    channel: 'IN_APP',
    language: 'en',
    title: 'Booking Cancelled',
    body: `Your booking at {{listingTitle}} for {{bookingDate}} has been cancelled.`,
    variables: ['listingTitle', 'bookingDate'],
  },

  // ============================================
  // BOOKING REMINDER (24h before)
  // ============================================
  {
    slug: 'booking_reminder',
    type: 'BOOKING_REMINDER',
    channel: 'EMAIL',
    language: 'en',
    subject: 'Reminder: Your booking is tomorrow!',
    title: 'See you tomorrow! 📅',
    body: `Hi {{userName}},

Just a friendly reminder that your booking is tomorrow!

**Details:**
- Venue: {{listingTitle}}
- Date: {{bookingDate}}
- Time: {{startTime}} - {{endTime}}
- Address: {{listingAddress}}

**Tips:**
- Arrive 10 minutes early
- Contact host if you're running late: {{hostPhone}}

Have a great event!
{{appName}} Team`,
    variables: ['userName', 'listingTitle', 'bookingDate', 'startTime', 'endTime', 'listingAddress', 'hostPhone', 'appName'],
  },
  {
    slug: 'booking_reminder',
    type: 'BOOKING_REMINDER',
    channel: 'SMS',
    language: 'en',
    title: 'Booking Reminder',
    body: `{{appName}} Reminder: Your booking at {{listingTitle}} is tomorrow at {{startTime}}. Address: {{listingAddress}}`,
    variables: ['appName', 'listingTitle', 'startTime', 'listingAddress'],
  },
  {
    slug: 'booking_reminder',
    type: 'BOOKING_REMINDER',
    channel: 'IN_APP',
    language: 'en',
    title: 'Reminder: Booking Tomorrow! 📅',
    body: `Your booking at {{listingTitle}} is tomorrow at {{startTime}}.`,
    variables: ['listingTitle', 'startTime'],
  },

  // ============================================
  // PAYMENT RECEIVED (For Host)
  // ============================================
  {
    slug: 'payment_received',
    type: 'PAYMENT_RECEIVED',
    channel: 'EMAIL',
    language: 'en',
    subject: 'Payment Received - {{totalPrice}}',
    title: 'Payment Received 💰',
    body: `Hi {{hostName}},

You've received a payment!

**Payment Details:**
- Amount: {{totalPrice}}
- Booking #: {{bookingNumber}}
- Venue: {{listingTitle}}
- Guest: {{guestName}}

The funds will be available in your account after the booking is completed.

{{appName}} Team`,
    variables: ['hostName', 'totalPrice', 'bookingNumber', 'listingTitle', 'guestName', 'appName'],
  },
  {
    slug: 'payment_received',
    type: 'PAYMENT_RECEIVED',
    channel: 'IN_APP',
    language: 'en',
    title: 'Payment Received 💰',
    body: `You received {{totalPrice}} for booking #{{bookingNumber}}.`,
    variables: ['totalPrice', 'bookingNumber'],
  },

  // ============================================
  // NEW REVIEW
  // ============================================
  {
    slug: 'new_review',
    type: 'NEW_REVIEW',
    channel: 'EMAIL',
    language: 'en',
    subject: 'New Review for {{listingTitle}}',
    title: 'You have a new review! ⭐',
    body: `Hi {{hostName}},

{{guestName}} left a review for {{listingTitle}}.

**Rating:** {{rating}} stars

**Review:**
"{{reviewContent}}"

Log in to your dashboard to respond to this review.

{{appName}} Team`,
    variables: ['hostName', 'guestName', 'listingTitle', 'rating', 'reviewContent', 'appName'],
  },
  {
    slug: 'new_review',
    type: 'NEW_REVIEW',
    channel: 'IN_APP',
    language: 'en',
    title: 'New Review ⭐',
    body: `{{guestName}} left a {{rating}}-star review for {{listingTitle}}.`,
    variables: ['guestName', 'rating', 'listingTitle'],
  },

  // ============================================
  // WELCOME
  // ============================================
  {
    slug: 'welcome',
    type: 'WELCOME',
    channel: 'EMAIL',
    language: 'en',
    subject: 'Welcome to {{appName}}! 🎉',
    title: 'Welcome to {{appName}}!',
    body: `Hi {{userName}},

Welcome to {{appName}}! We're excited to have you.

**What you can do:**
- Browse unique venues for your events
- Book spaces by the hour
- Leave reviews after your visit

**Getting Started:**
1. Complete your profile
2. Verify your phone number
3. Browse available spaces

If you have any questions, reach out to us at {{supportEmail}}.

Happy booking!
The {{appName}} Team`,
    variables: ['userName', 'appName', 'supportEmail'],
  },
  {
    slug: 'welcome',
    type: 'WELCOME',
    channel: 'IN_APP',
    language: 'en',
    title: 'Welcome to {{appName}}! 🎉',
    body: `Welcome! Complete your profile to get started.`,
    variables: ['appName'],
  },

  // ============================================
  // SUBSCRIPTION EXPIRING
  // ============================================
  {
    slug: 'subscription_expiring',
    type: 'SUBSCRIPTION_EXPIRING',
    channel: 'EMAIL',
    language: 'en',
    subject: 'Your {{tierName}} subscription expires in {{daysLeft}} days',
    title: 'Subscription Expiring Soon ⚠️',
    body: `Hi {{userName}},

Your {{tierName}} subscription will expire on {{expiryDate}} ({{daysLeft}} days from now).

**What happens next:**
- Your listings will be limited to Free tier
- Some features may become unavailable

To avoid interruption, renew your subscription today.

{{appName}} Team`,
    variables: ['userName', 'tierName', 'expiryDate', 'daysLeft', 'appName'],
  },
  {
    slug: 'subscription_expiring',
    type: 'SUBSCRIPTION_EXPIRING',
    channel: 'IN_APP',
    language: 'en',
    title: 'Subscription Expiring ⚠️',
    body: `Your {{tierName}} subscription expires in {{daysLeft}} days. Renew now to avoid interruption.`,
    variables: ['tierName', 'daysLeft'],
  },

  // ============================================
  // SUBSCRIPTION EXPIRED
  // ============================================
  {
    slug: 'subscription_expired',
    type: 'SUBSCRIPTION_EXPIRED',
    channel: 'EMAIL',
    language: 'en',
    subject: 'Your {{tierName}} subscription has expired',
    title: 'Subscription Expired',
    body: `Hi {{userName}},

Your {{tierName}} subscription has expired.

Your account has been moved to the Free tier. Some features may be limited.

Renew your subscription to restore full access to all features.

{{appName}} Team`,
    variables: ['userName', 'tierName', 'appName'],
  },
  {
    slug: 'subscription_expired',
    type: 'SUBSCRIPTION_EXPIRED',
    channel: 'SMS',
    language: 'en',
    title: 'Subscription Expired',
    body: `{{appName}}: Your {{tierName}} subscription has expired. Renew now to restore full access.`,
    variables: ['appName', 'tierName'],
  },
  {
    slug: 'subscription_expired',
    type: 'SUBSCRIPTION_EXPIRED',
    channel: 'IN_APP',
    language: 'en',
    title: 'Subscription Expired',
    body: `Your {{tierName}} subscription has expired. Renew to restore full access.`,
    variables: ['tierName'],
  },

  // ============================================
  // LISTING APPROVED
  // ============================================
  {
    slug: 'listing_approved',
    type: 'LISTING_APPROVED',
    channel: 'EMAIL',
    language: 'en',
    subject: 'Your listing has been approved! 🎉',
    title: 'Listing Approved!',
    body: `Hi {{hostName}},

Great news! Your listing "{{listingTitle}}" has been approved and is now live.

Guests can now find and book your space.

**Tips to get more bookings:**
- Add high-quality photos
- Write a detailed description
- Set competitive pricing
- Respond quickly to inquiries

{{appName}} Team`,
    variables: ['hostName', 'listingTitle', 'appName'],
  },
  {
    slug: 'listing_approved',
    type: 'LISTING_APPROVED',
    channel: 'IN_APP',
    language: 'en',
    title: 'Listing Approved! 🎉',
    body: `Your listing "{{listingTitle}}" is now live and accepting bookings.`,
    variables: ['listingTitle'],
  },

  // ============================================
  // MESSAGE
  // ============================================
  {
    slug: 'message',
    type: 'MESSAGE',
    channel: 'IN_APP',
    language: 'en',
    title: 'New Message',
    body: `{{senderName}}: {{messagePreview}}`,
    variables: ['senderName', 'messagePreview'],
  },

  // ============================================
  // BLOG APPROVED
  // ============================================
  {
    slug: 'blog_approved',
    type: 'BLOG_APPROVED',
    channel: 'EMAIL',
    language: 'en',
    subject: 'Your blog post has been published!',
    title: 'Blog Post Published! 📝',
    body: `Hi {{userName}},

Your blog post "{{blogTitle}}" has been approved and published!

Share it with your audience and start getting views.

{{appName}} Team`,
    variables: ['userName', 'blogTitle', 'appName'],
  },
  {
    slug: 'blog_approved',
    type: 'BLOG_APPROVED',
    channel: 'IN_APP',
    language: 'en',
    title: 'Blog Published! 📝',
    body: `Your blog post "{{blogTitle}}" is now live.`,
    variables: ['blogTitle'],
  },

  // ============================================
  // PASSWORD CHANGED
  // ============================================
  {
    slug: 'password_changed',
    type: 'PASSWORD_CHANGED',
    channel: 'EMAIL',
    language: 'en',
    subject: 'Your password was changed',
    title: 'Password Changed',
    body: `Hi {{userName}},

Your password was successfully changed on {{changedAt}}.

If you didn't make this change, please contact our support team immediately at {{supportEmail}}.

{{appName}} Team`,
    variables: ['userName', 'changedAt', 'supportEmail', 'appName'],
  },
  {
    slug: 'password_changed',
    type: 'PASSWORD_CHANGED',
    channel: 'IN_APP',
    language: 'en',
    title: 'Password Changed',
    body: `Your password was successfully changed.`,
    variables: [],
  },
];

/**
 * Seed templates to database
 */
export async function seedTemplates(prisma) {
  console.log('Seeding notification templates...');
  
  for (const template of DEFAULT_TEMPLATES) {
    await prisma.notificationTemplate.upsert({
      where: {
        slug_channel_language: {
          slug: template.slug,
          channel: template.channel,
          language: template.language,
        },
      },
      update: {
        type: template.type,
        subject: template.subject,
        title: template.title,
        body: template.body,
        variables: template.variables,
      },
      create: template,
    });
  }
  
  console.log(`Seeded ${DEFAULT_TEMPLATES.length} notification templates`);
}