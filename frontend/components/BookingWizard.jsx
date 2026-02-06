// components/BookingWizard.jsx
export const BookingWizard = ({ listing, onComplete }) => {
  const [step, setStep] = useState(1);
  const [bookingData, setBookingData] = useState({
    date: '',
    time: { start: '', end: '' },
    guests: 1,
    details: { name: '', email: '', phone: '', notes: '' }
  });

  const steps = [
    { id: 1, title: 'Select Date & Time', icon: '📅' },
    { id: 2, title: 'Guest Details', icon: '👥' },
    { id: 3, title: 'Add Extras', icon: '✨' },
    { id: 4, title: 'Confirm Booking', icon: '✓' }
  ];

  return (
    <div className="booking-wizard">
      {/* Step indicator */}
      <div className="step-indicator">
        {steps.map((s, i) => (
          <div key={s.id} className={`step ${s.id <= step ? 'active' : ''}`}>
            <div className="step-icon">{s.icon}</div>
            <span className="step-title">{s.title}</span>
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="step-content">
        {step === 1 && <DateTimeStep />}
        {step === 2 && <GuestDetailsStep />}
        {step === 3 && <ExtrasStep />}
        {step === 4 && <ConfirmationStep />}
      </div>

      {/* Navigation */}
      <div className="step-navigation">
        {step > 1 && (
          <button onClick={() => setStep(step - 1)}>
            ← Back
          </button>
        )}
        {step < 4 ? (
          <button onClick={() => setStep(step + 1)}>
            Continue →
          </button>
        ) : (
          <button onClick={onComplete}>
            Confirm Booking
          </button>
        )}
      </div>
    </div>
  );
};