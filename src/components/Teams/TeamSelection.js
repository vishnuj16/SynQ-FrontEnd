import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const TeamManagement = () => {
  const [teams, setTeams] = useState([]);
  const [newTeamName, setNewTeamName] = useState('');
  const [inviteCode, setInviteCode] = useState('');
  const [showJoinDialog, setShowJoinDialog] = useState(false);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [invitations, setInvitations] = useState({}); // ✅ Added missing state
  const navigate = useNavigate();

  useEffect(() => {
    fetchTeams();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/chat/teams/', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      const data = await response.json();
      setTeams(data);
    } catch (error) {
      setError('Error fetching teams');
    }
  };

  const createTeam = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/chat/teams/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: newTeamName })
      });
      
      if (!response.ok) throw new Error('Failed to create team');
      
      setSuccess('Team created successfully!');
      setNewTeamName('');
      setShowCreateDialog(false);
      fetchTeams();
    } catch (error) {
      setError('Error creating team');
    }
  };

  const joinTeam = async () => {
    try {
      const response = await fetch('http://localhost:8000/api/chat/teams/join_via_invitation/', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ invite_code: inviteCode })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to join team');
      }

      setSuccess('Successfully joined team!');
      setInviteCode('');
      setShowJoinDialog(false);
      fetchTeams();
    } catch (error) {
      setError(error.message);
    }
  };

  const createInvitation = async (teamId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/chat/teams/${teamId}/create_invitation/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      setInvitations({
        ...invitations,
        [teamId]: [...(invitations[teamId] || []), data]
      });
      setSuccess('Invitation created successfully!');
    } catch (error) {
      setError('Error creating invitation');
    }
  };

  const fetchInvitations = async (teamId) => {
    try {
      const response = await fetch(`http://localhost:8000/api/chat/teams/${teamId}/invitations/`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const data = await response.json();
      setInvitations({ ...invitations, [teamId]: data });
    } catch (error) {
      setError('Error fetching invitations');
    }
  };

  const revokeInvitation = async (teamId, inviteCode) => {
    try {
      await fetch(`http://localhost:8000/api/chat/teams/${teamId}/revoke_invitation/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ invite_code: inviteCode })
      });
      
      setSuccess('Invitation revoked successfully!');
      fetchInvitations(teamId);
    } catch (error) {
      setError('Error revoking invitation');
    }
  };

  return (
    <div className="container">
      <h1>Team Management</h1>
      <button onClick={() => setShowCreateDialog(true)}>Create Team</button>
      <button onClick={() => setShowJoinDialog(true)}>Join Team</button>

      {error && <div className="alert error">{error}</div>}
      {success && <div className="alert success">{success}</div>}

      {showCreateDialog && (
        <div className="modal">
          <div className="modal-content">
            <h2>Create New Team</h2>
            <input type="text" value={newTeamName} onChange={(e) => setNewTeamName(e.target.value)} placeholder="Team Name" />
            <button onClick={createTeam}>Create Team</button>
            <button onClick={() => setShowCreateDialog(false)}>Close</button>
          </div>
        </div>
      )}

      {showJoinDialog && (
        <div className="modal">
          <div className="modal-content">
            <h2>Join Team</h2>
            <input type="text" value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} placeholder="Enter Invitation Code" />
            <button onClick={joinTeam}>Join Team</button>
            <button onClick={() => setShowJoinDialog(false)}>Close</button>
          </div>
        </div>
      )}

        {teams.map(team => (
          <div key={team.id}>
            <h2>{team.name}</h2>
            <div className="button-container">
              <button 
                className="top-button"
                onClick={() => navigate(`/chat/${team.id}`)}
              >
                Open
              </button>
              <div className="bottom-buttons">
                <button onClick={() => createInvitation(team.id)}>
                  Create Invitation
                </button>
                <button onClick={() => fetchInvitations(team.id)}>
                  List Invitations
                </button>
              </div>
            </div>
            {invitations[team.id] && invitations[team.id].map(invite => (
              <div key={invite.invite_code}>
                <span>Code: {invite.invite_code}</span>
                <button onClick={() => revokeInvitation(team.id, invite.invite_code)}>Revoke</button>
              </div>
            ))}
          </div>
        ))}
      </div>
  );
};

export default TeamManagement;
