// components/TeamBooking.jsx
export const TeamBooking = ({ listingId }) => {
  const [teamMembers, setTeamMembers] = useState([]);
  const [sharedAvailability, setSharedAvailability] = useState({});

  // Share booking link with team
  const generateShareLink = () => {
    return `${window.location.origin}/booking/${listingId}/team/${generateToken()}`;
  };

  // Sync team availability
  const syncAvailability = async () => {
    const responses = await Promise.all(
      teamMembers.map(member => 
        api.get(`/api/availability/team/${member.id}`)
      )
    );
    
    // Find common available slots
    const commonSlots = findCommonSlots(responses);
    setSharedAvailability(commonSlots);
  };

  return (
    <div className="team-booking">
      <h3>Team Booking</h3>
      
      {/* Add team members */}
      <div className="team-members">
        {teamMembers.map(member => (
          <TeamMemberCard key={member.id} member={member} />
        ))}
        <AddMemberForm onAdd={addTeamMember} />
      </div>

      {/* Shared calendar */}
      <TeamCalendar availability={sharedAvailability} />
      
      {/* Share link */}
      <div className="share-section">
        <input readOnly value={generateShareLink()} />
        <button onClick={copyLink}>Copy Link</button>
      </div>
    </div>
  );
};