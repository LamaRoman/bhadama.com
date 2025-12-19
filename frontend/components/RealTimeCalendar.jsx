// components/RealTimeCalendar.jsx
export const RealTimeCalendar = ({ listingId, onDateSelect }) => {
  const [availability, setAvailability] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const socketRef = useRef();

  useEffect(() => {
    // Connect to WebSocket for real-time updates
    socketRef.current = new WebSocket(process.env.NEXT_PUBLIC_WS_URL);
    
    socketRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === 'AVAILABILITY_UPDATE') {
        setAvailability(prev => ({
          ...prev,
          [data.date]: data.slots
        }));
      }
    };

    return () => {
      socketRef.current?.close();
    };
  }, [listingId]);

  return (
    <div className="real-time-calendar">
      <div className="availability-status">
        <div className="status-indicator">
          <span className="available-dot"></span>
          <span>Available</span>
        </div>
        <div className="status-indicator">
          <span className="booked-dot"></span>
          <span>Booked</span>
        </div>
        <div className="status-indicator">
          <span className="blocked-dot"></span>
          <span>Blocked</span>
        </div>
      </div>

      <div className="calendar-grid">
        {/* Calendar days with real-time availability */}
        {generateCalendarDays().map(day => (
          <div
            key={day.date}
            className={`calendar-day ${
              availability[day.date]?.status || 'unknown'
            }`}
            onClick={() => {
              if (availability[day.date]?.status === 'available') {
                setSelectedDate(day.date);
                onDateSelect(day.date);
              }
            }}
          >
            <span className="day-number">{day.number}</span>
            <div className="time-slots">
              {availability[day.date]?.slots?.map(slot => (
                <div key={slot.time} className="time-slot">
                  {slot.time}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};