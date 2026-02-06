// backend/services/notification/templates/TemplateEngine.js
// Template rendering engine for notifications

class TemplateEngine {
  /**
   * Render a template string with variables
   * 
   * @param {string} template - Template with {{variable}} placeholders
   * @param {Object} variables - Key-value pairs for replacement
   * @returns {string} Rendered template
   */
  render(template, variables) {
    if (!template) return '';
    
    let result = template;
    
    // Replace all {{variable}} patterns
    for (const [key, value] of Object.entries(variables)) {
      const regex = new RegExp(`{{${key}}}`, 'g');
      result = result.replace(regex, value ?? '');
    }
    
    // Check for unreplaced variables (debugging)
    const unreplaced = result.match(/{{(\w+)}}/g);
    if (unreplaced && unreplaced.length > 0) {
      console.warn('[TemplateEngine] Unreplaced variables:', unreplaced.join(', '));
    }
    
    return result;
  }

  /**
   * Format price for display
   * 
   * @param {number} amount - Amount
   * @param {string} currency - Currency code (NPR, USD, INR)
   * @returns {string} Formatted price
   */
  formatPrice(amount, currency = 'NPR') {
    if (amount === null || amount === undefined) return '';
    
    const formatters = {
      NPR: new Intl.NumberFormat('en-NP', { style: 'currency', currency: 'NPR' }),
      USD: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }),
      INR: new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }),
    };
    
    const formatter = formatters[currency] || formatters.NPR;
    
    try {
      return formatter.format(amount);
    } catch {
      return `${currency} ${amount}`;
    }
  }

  /**
   * Format date for display
   * 
   * @param {Date|string} date - Date to format
   * @param {Object} options - Intl.DateTimeFormat options
   * @returns {string} Formatted date
   */
  formatDate(date, options = {}) {
    if (!date) return '';
    
    const defaultOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    };
    
    try {
      return new Date(date).toLocaleDateString('en-US', { ...defaultOptions, ...options });
    } catch {
      return String(date);
    }
  }

  /**
   * Format date short (e.g., "Jan 15, 2024")
   */
  formatDateShort(date) {
    return this.formatDate(date, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  /**
   * Format time for display (e.g., "2:30 PM")
   * 
   * @param {string} time - Time in 24h format "14:30"
   * @returns {string} Formatted time in 12h format
   */
  formatTime(time) {
    if (!time) return '';
    
    try {
      const [hours, minutes] = time.split(':').map(Number);
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHour = hours % 12 || 12;
      return `${displayHour}:${String(minutes).padStart(2, '0')} ${ampm}`;
    } catch {
      return time;
    }
  }

  /**
   * Format duration (e.g., "4 hours")
   */
  formatDuration(hours) {
    if (!hours) return '';
    const h = parseFloat(hours);
    if (h === 1) return '1 hour';
    if (h < 1) return `${Math.round(h * 60)} minutes`;
    return `${h} hours`;
  }

  /**
   * Truncate text with ellipsis
   */
  truncate(text, maxLength = 100) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Strip HTML tags from text
   */
  stripHtml(html) {
    if (!html) return '';
    return html.replace(/<[^>]*>/g, '');
  }

  /**
   * Convert markdown-like bold to plain text
   */
  stripMarkdown(text) {
    if (!text) return '';
    return text
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/__(.*?)__/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  }
}

export default new TemplateEngine();