import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CssBaseline, useMediaQuery, useTheme } from '@mui/material';
import Sidebar from './Sidebar';
import MessageWindow from './MessageWindow';
import axios from 'axios';

const ChatInterface = ({ setIsAuthenticated }) => {
  const { teamId } = useParams();
  const navigate = useNavigate();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  // WebSocket reference
  const socketRef = useRef(null);
  
  // State variables
  const [channels, setChannels] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState(null);
  const [messages, setMessages] = useState([]);
  const [teamMembers, setTeamMembers] = useState([]);
  const [interactedUsers, setInteractedUsers] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  
  // Connect to WebSocket
  useEffect(() => {
    // Get token from local storage

    const connectWebSocket = () => {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setIsAuthenticated(false);
        navigate('/login');
        return;
      }

      if (socketRef.current) {
        socketRef.current.close();
        socketRef.current = null;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // Initialize WebSocket connection
      const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${wsProtocol}//${window.location.hostname}:8000/ws/chat/?token=${token}`;
      socketRef.current = new WebSocket(wsUrl);
      
      socketRef.current.onopen = () => {
        console.log('WebSocket connection established');
        fetchInitialData();
      };
      
      socketRef.current.onclose = (e) => {
        console.log('WebSocket connection closed', e);
        // Handle reconnection logic if needed
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!socketRef.current || socketRef.current.readyState === WebSocket.CLOSED) {
            console.log('Attempting to reconnect...');
            connectWebSocket();
          }
        }, 3000)

      };
      
      socketRef.current.onerror = (err) => {
        console.error('WebSocket error', err);
        // setError('Failed to connect to the chat server. Please refresh the page.');
      };
      
      socketRef.current.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };
      
    }
    connectWebSocket();

    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.close();
      }
    };
    
  }, [teamId, navigate, setIsAuthenticated, messages]);
  
  // Fetch initial data when WebSocket is connected
  const fetchInitialData = () => {
    setLoading(true);
    
    // Fetch channels
    fetchChannels();
    
    // Fetch team members
    sendWebSocketMessage({
      message_type: 'get_team_members',
      team_id: teamId
    });
    
    // Fetch interacted users (for DMs)
    sendWebSocketMessage({
      message_type: 'get_interacted_users',
      team_id: teamId
    });
    
    setLoading(false);
  };
  
  // Fetch channels from API
  const fetchChannels = async () => {
    try {
      const response = await axios.post('http://localhost:8000/api/chat/channels/team_id/', {
        team_id: teamId
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      setChannels(response.data);
      
      // Select the first channel by default if no channel is selected
      if (response.data.length > 0 && !selectedChannel) {
        const defaultChannel = response.data.find(c => !c.is_direct_message) || response.data[0];
        setSelectedChannel(defaultChannel);
        fetchChannelMessages(defaultChannel.id);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      setError('Failed to load channels. Please try again later.');
    }
  };
  
  // Fetch messages for a channel
  const fetchChannelMessages = (channelId) => {
    sendWebSocketMessage({
      message_type: selectedChannel?.is_direct_message ? 'get_direct_messages' : 'get_channel_messages',
      channel_id: channelId
    });
  };
  
  // Send message through WebSocket
  const sendWebSocketMessage = (message) => {
    if (socketRef.current && socketRef.current.readyState === WebSocket.OPEN) {
      socketRef.current.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not connected');
      // setError('Connection to chat server lost. Please refresh the page.');
    }
  };
  
  // Handle incoming WebSocket messages
  const handleWebSocketMessage = (data) => {
    console.log('Received WebSocket message:', data);
    
    switch (data.type) {
      case 'channel_messages':
      case 'direct_messages':
        setMessages(data.messages);
        break;
        
      case 'team_members':
        setTeamMembers(data.members);
        break;
        
      case 'interacted_users':
        setInteractedUsers(data.users);
        break;
        
      case 'message_deleted':
        setMessages(prevMessages => 
          prevMessages.filter(msg => msg.id !== data.message_id)
        );
        break;
        
      case 'reaction_update':
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg.id === data.message_id ? { ...msg, reactions: data.reactions } : msg
          )
        );
        break;
        
      default:
        // Handle new message
        if (data.type === 'direct' || data.type === 'channels') {
          console.log('New message:', data);
          if (selectedChannel && data.channel_id === selectedChannel.id) {
            setMessages(prevMessages => [...prevMessages, data]);
            console.log('Updated Messages : ', messages)
          }
        }
        break;
    }
  };
  
  // Handle channel selection
  const handleChannelSelect = (channel) => {
    setSelectedChannel(channel);
    fetchChannelMessages(channel.id);
    if (isMobile) {
      setMobileOpen(false);
    }
  };
  
  // Handle creating a new channel
  const handleCreateChannel = (channelName) => {
    sendWebSocketMessage({
      message_type: 'create_channel',
      team_id: teamId,
      name: channelName
    });
  };
  
  // Handle creating or getting a DM channel
  const handleCreateOrGetDMChannel = async (userId) => {
    try {
      const response = await axios.post('http://localhost:8000/api/chat/channels/create_or_get_dm_channel/', {
        team_id: teamId,
        user_id: userId
      }, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      const dmChannel = response.data;
      
      // Check if the channel already exists in the list
      const channelExists = channels.some(c => c.id === dmChannel.id);
      
      if (!channelExists) {
        setChannels(prevChannels => [...prevChannels, dmChannel]);
      }
      
      // Select the DM channel
      setSelectedChannel(dmChannel);
      fetchChannelMessages(dmChannel.id);
      
      if (isMobile) {
        setMobileOpen(false);
      }
    } catch (error) {
      console.error('Error creating/getting DM channel:', error);
      setError('Failed to open direct message. Please try again.');
    }
  };
  
  // Handle sending a message
  const handleSendMessage = (content, replyToId = null) => {
    if (!selectedChannel) return;
    
    const messageData = {
      content: content,
      channel: selectedChannel.id,
      reply_to: replyToId
    };
    
    if (selectedChannel.is_direct_message) {
      // Get the other user's ID for direct messages
      const otherUserId = interactedUsers.find(
        user => user.channel_id === selectedChannel.id
      )?.id;
      
      if (otherUserId) {
        sendWebSocketMessage({
          message_type: 'direct_message',
          recipient_id: otherUserId,
          content: content,
          team_id: teamId,
          reply_to: replyToId,
          channel_id: selectedChannel.id
        });
      }
    } else {
      sendWebSocketMessage({
        message_type: 'channel_message',
        channel: selectedChannel.id,
        content: content,
        reply_to: replyToId
      });
    }
  };
  
  // Handle deleting a message
  const handleDeleteMessage = (messageId) => {
    sendWebSocketMessage({
      message_type: 'delete_message',
      message_id: messageId,
      type: selectedChannel?.is_direct_message ? 'direct' : 'channel'
    });
  };
  
  // Handle adding a reaction
  const handleReaction = (messageId, reaction) => {
    sendWebSocketMessage({
      message_type: 'reaction',
      message_id: messageId,
      reaction: reaction
    });
  };
  
  // Toggle drawer for mobile view
  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      <Sidebar 
        channels={channels}
        teamMembers={teamMembers}
        interactedUsers={interactedUsers}
        selectedChannel={selectedChannel}
        onChannelSelect={handleChannelSelect}
        onCreateChannel={handleCreateChannel}
        onCreateOrGetDMChannel={handleCreateOrGetDMChannel}
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        isMobile={isMobile}
        teamId={teamId}
      />
      
      <MessageWindow 
        messages={messages}
        selectedChannel={selectedChannel}
        teamMembers={teamMembers}
        onSendMessage={handleSendMessage}
        onDeleteMessage={handleDeleteMessage}
        onReact={handleReaction}
        handleDrawerToggle={handleDrawerToggle}
        loading={loading}
        error={error}
      />
    </Box>
  );
};

export default ChatInterface;