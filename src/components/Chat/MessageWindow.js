import React, { useState, useRef, useEffect, useCallback } from 'react';

function MessageWindow({ messages, selectedChat, onSendMessage, isConnected }) {
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  const scrollToBottom = useCallback(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [shouldAutoScroll]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Handle scroll events to determine if auto-scroll should continue
  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      onSendMessage(newMessage);
      setNewMessage('');
      setShouldAutoScroll(true); // Enable auto-scroll when sending a message
    }
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  if (!selectedChat) {
    return (
      <div className="message-window">
        <div className="no-chat-selected">
          Select a channel or user to start chatting
        </div>
      </div>
    );
  }

  return (
    <div className="message-window">
      <div className="chat-header">
      {selectedChat.type === 'channel' 
        ? `# ${selectedChat.name}` 
        : selectedChat.username || 'Unknown User'}
        <span className={`connection-status ${isConnected ? 'connected' : 'disconnected'}`}>
          {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
        </span>
      </div>
      
      <div 
        className="messages-container"
        ref={messagesContainerRef}
        onScroll={handleScroll}
      >
        {messages.length === 0 ? (
          <div className="no-messages">No messages yet</div>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.sender === localStorage.getItem('username');
            const showSender = index === 0 || 
              messages[index - 1].sender !== message.sender;

            return (
              <div 
                key={message.id || index}
                className={`message ${isOwnMessage ? 'own-message' : ''}`}
              >
                {showSender && (
                <div className="message-sender">{message.sender.toString() || 'Unknown'}</div>
                )}

                <div className="message-content">
                  {message.content}
                  <span className="message-timestamp">
                    {formatTimestamp(message.timestamp)}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSubmit} className="message-input-form">
        <input
          type="text"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          disabled={!isConnected}
          className={!isConnected ? 'disabled' : ''}
        />
        <button 
          type="submit" 
          disabled={!isConnected || !newMessage.trim()}
        >
          Send
        </button>
      </form>
    </div>
  );
}

export default MessageWindow;