import React, {useState, useEffect} from 'react';

function Sidebar({ channels, interactedUsers, selectedChat, onSelectChat, teamId }) {
  const [newChannelName, setNewChannelName] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);

  useEffect(() => {
    if (teamId) {
      fetch(`http://localhost:8000/api/chat/users/in_team/?team_id=${teamId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
      })
        .then((res) => res.json())
        .then((data) => setAllUsers(data))
        .catch((error) => console.error('Error fetching users:', error));
    }
  }, [teamId]);

  const sendMessage = async (user) => {
    try {
      const response = await fetch('http://localhost:8000/api/chat/messages/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ 
          "content": "Hey!",
          "message_type": "direct",
          "recipient": user.id 
        }),
      });

      console.log("Send response : ", response)
      onSelectChat({ type: 'direct', ...user });
      setShowUserList(false);
    } catch (error) {
      console.log("Error : ", error)
    }
  }

  const createNewChannel = async () => {
    if (!newChannelName.trim() || !teamId) return;

    try {
      const response = await fetch('http://localhost:8000/api/chat/channels/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('token')}`, // Assuming token-based auth
        },
        body: JSON.stringify({ 
          name: newChannelName, 
          team: teamId  // Include the team ID 
        }),
      });

      if (response.ok) {
        const newChannel = await response.json();
        channels.push(newChannel)
        setNewChannelName(""); // Reset input field
      } else {
        console.error('Failed to add channel');
      }
    } catch (error) {
      console.error('Error adding channel:', error);
    }
  }
  
  return (
    <div className="sidebar">
      <div className="channels-section">
        <h3>Channels</h3>
        <div className="add-channel">
          <input
            type="text"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
            placeholder="New channel name"
          />
          <button onClick={createNewChannel}>Add</button>
        </div>

        {channels.map(channel => (
          <div
            key={channel.id}
            className={`channel-item ${selectedChat?.id === channel.id ? 'selected' : ''}`}
            onClick={() => onSelectChat({ type: 'channel', ...channel })}
          >
            # {channel.name}
          </div>
        ))}
      </div>
      
      <div className="users-section">
        <h3>Direct Messages</h3>
        <button onClick={() => setShowUserList(!showUserList)}>+</button>
        {showUserList && (
          <div className="user-selection">
            {allUsers.map((user) => (
              <div key={user.id} className="user-item" onClick={() => sendMessage(user)}>
                {user.username}
              </div>
            ))}
          </div>
        )}
        {interactedUsers.map(user => (
          <div
            key={user.id}
            className={`user-item ${selectedChat?.id === user.id ? 'selected' : ''}`}
            onClick={() => onSelectChat({ type: 'direct', ...user })}
          >
            {user.username}
          </div>
        ))}
      </div>
    </div>
  );
}

export default Sidebar;