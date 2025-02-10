import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function TeamSelection() {
  const [teams, setTeams] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/chat/teams', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  return (
    <div className="team-selection">
      <h2>Select a Team</h2>
      <div className="teams-list">
        {teams.map(team => (
          <div 
            key={team.id} 
            className="team-card"
            onClick={() => navigate(`/chat/${team.id}`)}
          >
            {team.name}
          </div>
        ))}
      </div>
    </div>
  );
}

export default TeamSelection;