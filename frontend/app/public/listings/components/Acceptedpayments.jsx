// ==========================================
// ACCEPTED PAYMENT METHODS COMPONENT
// ==========================================
// Add this to BookingCard or any checkout component
// Usage: <AcceptedPayments />
// ==========================================

export default function AcceptedPayments({ size = "sm", showLabel = true }) {
  const sizes = {
    xs: { badge: "px-1 py-0.5 text-[7px]", circle: "w-2 h-2" },
    sm: { badge: "px-1.5 py-0.5 text-[8px]", circle: "w-2.5 h-2.5" },
    md: { badge: "px-2 py-1 text-[9px]", circle: "w-3 h-3" },
    lg: { badge: "px-2.5 py-1 text-[10px]", circle: "w-3.5 h-3.5" },
  };

  const s = sizes[size] || sizes.sm;

  return (
    <div className="flex items-center justify-center gap-2">
      {showLabel && (
        <span className="text-xs text-stone-400">We accept:</span>
      )}
      <div className="flex items-center gap-1">
        {/* eSewa */}
        <div className={`${s.badge} bg-[#60BB46] rounded`}>
          <span className="text-white font-bold">eSewa</span>
        </div>
        
        {/* Khalti */}
        <div className={`${s.badge} bg-[#5C2D91] rounded`}>
          <span className="text-white font-bold">Khalti</span>
        </div>
        
        {/* Visa */}
        <div className={`${s.badge} bg-[#1A1F71] rounded`}>
          <span className="text-white font-bold italic">VISA</span>
        </div>
        
        {/* Mastercard */}
        <div className={`${s.badge} bg-gray-100 rounded flex items-center`}>
          <div className={`${s.circle} rounded-full bg-[#EB001B]`} />
          <div className={`${s.circle} rounded-full bg-[#F79E1B] -ml-1`} />
        </div>
      </div>
    </div>
  );
}

// Alternative: Inline version for BookingCard.jsx
// Copy this JSX directly into your BookingCard where you want to show it
export const AcceptedPaymentsInline = () => (
  <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-stone-100">
    <span className="text-xs text-stone-400">We accept:</span>
    <div className="flex items-center gap-1">
      {/* eSewa */}
      <div className="px-1.5 py-0.5 bg-[#60BB46] rounded">
        <span className="text-white text-[8px] font-bold">eSewa</span>
      </div>
      {/* Khalti */}
      <div className="px-1.5 py-0.5 bg-[#5C2D91] rounded">
        <span className="text-white text-[8px] font-bold">Khalti</span>
      </div>
      {/* Visa */}
      <div className="px-1.5 py-0.5 bg-[#1A1F71] rounded">
        <span className="text-white text-[8px] font-bold italic">VISA</span>
      </div>
      {/* Mastercard */}
      <div className="px-1 py-0.5 bg-gray-100 rounded flex items-center">
        <div className="w-2 h-2 rounded-full bg-[#EB001B]" />
        <div className="w-2 h-2 rounded-full bg-[#F79E1B] -ml-0.5" />
      </div>
    </div>
  </div>
);