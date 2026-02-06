// ==========================================
// PAYMENT LOGOS - REUSABLE COMPONENT
// ==========================================
// Use everywhere: BookingCard, Checkout, Footer, etc.
//
// Usage:
//   import PaymentLogos from "@/components/PaymentLogos";
//   <PaymentLogos />                    // Default
//   <PaymentLogos size="lg" />          // Larger
//   <PaymentLogos showLabel={false} />  // No "Secure payment" text
//   <PaymentLogos variant="minimal" />  // Just logos, no container
// ==========================================

export default function PaymentLogos({ 
  size = "md", 
  showLabel = true,
  variant = "default" 
}) {
  // Size configurations
  const sizes = {
    sm: { height: "h-6", text: "text-xs", circle: "w-4 h-4", gap: "gap-2", px: "px-2" },
    md: { height: "h-8", text: "text-sm", circle: "w-5 h-5", gap: "gap-3", px: "px-3" },
    lg: { height: "h-10", text: "text-base", circle: "w-6 h-6", gap: "gap-4", px: "px-4" },
  };

  const s = sizes[size] || sizes.md;

  // Logos component (reused in all variants)
  const Logos = () => (
    <div className={`flex items-center justify-center ${s.gap}`}>
      {/* eSewa */}
      <div className={`${s.height} ${s.px} bg-[#60BB46] rounded-md flex items-center justify-center`}>
        <span className={`text-white ${s.text} font-semibold`}>eSewa</span>
      </div>

      {/* Khalti */}
      <div className={`${s.height} ${s.px} bg-[#5C2D91] rounded-md flex items-center justify-center`}>
        <span className={`text-white ${s.text} font-semibold`}>Khalti</span>
      </div>

      {/* Visa */}
      <div className={`${s.height} ${s.px} bg-[#1A1F71] rounded-md flex items-center justify-center`}>
        <span className={`text-white ${s.text} font-bold italic`}>VISA</span>
      </div>

      {/* Mastercard */}
      <div className={`${s.height} px-2.5 bg-white border border-stone-200 rounded-md flex items-center justify-center`}>
        <div className="flex -space-x-1.5">
          <div className={`${s.circle} rounded-full bg-[#EB001B]`} />
          <div className={`${s.circle} rounded-full bg-[#F79E1B]`} />
        </div>
      </div>
    </div>
  );

  // Minimal variant - just logos
  if (variant === "minimal") {
    return <Logos />;
  }

  // Default variant - with container and optional label
  return (
    <div className="mt-4 pt-4 border-t border-stone-200">
      {showLabel && (
        <div className="flex items-center justify-center gap-1.5 text-stone-500 mb-3">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <span className="text-xs font-medium">Secure payment</span>
        </div>
      )}
      <Logos />
    </div>
  );
}