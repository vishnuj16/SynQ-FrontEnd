import React from 'react';

function Sidebar({ channels, interactedUsers, selectedChat, onSelectChat }) {
  return (
    <div className="sidebar">
      <div className="channels-section">
        <h3>Channels</h3>
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