import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import Sidebar from './Sidebar';
import MessageWindow from './MessageWindow';

function ChatInterface() {
  const { teamId } = useParams();
  const [channels, setChannels] = useState([]);
  const [interactedUsers, setInteractedUsers] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [wsConnected, setWsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);

  const handleWebSocketMessage = useCallback((data) => {
    console.log('Received WebSocket data:', data);
    
    try {
      // Handle initial messages fetch response
      if (data.type === 'channel_messages' || data.type === 'direct_messages') {
        console.log('Setting initial messages:', data.messages);
        setMessages(data.messages);
        return;
      }

      // // Handle real-time messages
      // console.log('Direct message received:', data);
      // console.log('Selected chat:', selectedChat);
      // console.log('Current messages:', messages);
      if (data.message_type === 'channels') {
        if (selectedChat?.type === 'channel' && data.channel_id === selectedChat.id) {
          setMessages(prevMessages => [...prevMessages, data]);
        }
      } else if (data.message_type === 'direct') {
        if (selectedChat?.type === 'direct') {
          // Convert username to match selectedChat.id if needed
          const isSenderOrRecipient = 
            selectedChat.id === parseInt(data.recipient_id) || 
            selectedChat.username === data.sender;

          if (isSenderOrRecipient) {
            console.log('Adding new direct message');
            setMessages(prevMessages => [...(prevMessages || []), {
              id: data.id,
              content: data.content,
              sender: data.sender,
              timestamp: data.timestamp,
              message_type: 'direct'
            }]);
          }
        }
      }

      // console.log('After Direct message received:', data);
      // console.log('After Selected chat:', selectedChat);
      // console.log('After Current messages:', messages);
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }, [selectedChat]);

  const fetchChannels = useCallback(async () => {
    try {
      const response = await fetch(`http://localhost:8000/api/chat/channels/team_id/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ team_id: teamId })
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setChannels(data);
    } catch (error) {
      console.error('Error fetching channels:', error);
    }
  }, [teamId]);

  const fetchMessages = useCallback(async () => {
    if (!selectedChat) return;

    try {
      let url;
      if (selectedChat.type === 'channel') {
        url = `http://localhost:8000/api/chat/channels/${selectedChat.id}/messages/`;
      } else {
        url = `http://localhost:8000/api/chat/messages/direct_messages/?user_id=${selectedChat.id}`;
      }

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      setMessages(data);
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  }, [selectedChat]);

  const connectWebSocket = useCallback(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No token available for WebSocket connection');
      return;
    }

    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }

    try {
      wsRef.current = new WebSocket(`ws://localhost:8000/ws/chat/?token=${token}`);

      wsRef.current.onopen = () => {
        console.log("WebSocket connected");
        setWsConnected(true);
        if (selectedChat) {
          const request = selectedChat.type === 'channel' 
            ? { message_type: 'get_channel_messages', channel_id: selectedChat.id }
            : { message_type: 'get_direct_messages', user_id: selectedChat.id };
          wsRef.current.send(JSON.stringify(request));
        }
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          handleWebSocketMessage(data);
        } catch (error) {
          console.error('Error parsing WebSocket message:', error);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error("WebSocket Error:", error);
        setWsConnected(false);
      };

      wsRef.current.onclose = (event) => {
        console.log("WebSocket closed:", event);
        setWsConnected(false);
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            console.log('Attempting to reconnect...');
            connectWebSocket();
          }
        }, 3000);
      };
    } catch (error) {
      console.error('Error creating WebSocket connection:', error);
      setWsConnected(false);
    }
  }, [handleWebSocketMessage, selectedChat]);

  const handleChatSelect = (chat) => {
    setSelectedChat(chat);
    setMessages([]); // Clear messages before loading new ones
  };

  const fetchInteractedUsers = useCallback(async () => {
    console.log("Team ID : ", teamId)
    if (!teamId) {
        console.error('Team ID is required to fetch interacted users.');
        return;
    }

    try {
        const response = await fetch(`http://localhost:8000/api/chat/users/interacted/?team_id=${teamId}`, {
            headers: {
                'Authorization': `Bearer ${localStorage.getItem('token')}`
            }
        });

        console.log(response)

        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        const data = await response.json();
        setInteractedUsers(data);
    } catch (error) {
        console.error('Error fetching interacted users:', error);
    }
}, [teamId]);


  useEffect(() => {
    connectWebSocket();
    fetchChannels();
    fetchInteractedUsers();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [teamId, fetchChannels, connectWebSocket]);

  useEffect(() => {
    fetchMessages();
  }, [selectedChat, fetchMessages]);

  const sendMessage = (content) => {
    if (!selectedChat || !content.trim() || !wsConnected) {
      console.log('Cannot send message:', {
        selectedChat: !!selectedChat,
        contentProvided: !!content.trim(),
        wsConnected
      });
      return;
    }

    try {
      const message = {
        message_type: selectedChat.type === 'channel' ? 'channel_message' : 'direct_message',
        content,
        team_id: teamId,
        ...(selectedChat.type === 'channel' 
          ? { channel: selectedChat.id }
          : { recipient: selectedChat.id }
        )
      };

      wsRef.current.send(JSON.stringify(message));
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div>
      <br></br>
      <br></br>
      <br></br>
      <br></br>
      <div className="chat-interface">
      <Sidebar
        channels={channels}
        interactedUsers={interactedUsers}
        selectedChat={selectedChat}
        onSelectChat={handleChatSelect}
        teamId={teamId}
      />
      <MessageWindow
        key={selectedChat?.id}
        messages={messages}
        selectedChat={selectedChat}
        onSendMessage={sendMessage}
        isConnected={wsConnected}
      />
    </div>
    </div>
    
  );
}

export default ChatInterface;