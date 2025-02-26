import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, CssBaseline, useMediaQuery, useTheme, Grid, Button } from '@mui/material';
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
  const [activeChannels, setActiveChannels] = useState([]); // Array of active channels (max 3)
  const [messagesMap, setMessagesMap] = useState({}); // Map of channel id to messages
  const [teamMembers, setTeamMembers] = useState([]);
  const [interactedUsers, setInteractedUsers] = useState([]);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const reconnectTimeoutRef = useRef(null);
  const [selectedChannelsForForward, setSelectedChannelsForForward] = useState([]);
  
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
    
  }, [teamId, navigate, setIsAuthenticated, messagesMap]);
  
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
      if (response.data.length > 0 && activeChannels.length === 0) {
        const defaultChannel = response.data.find(c => !c.is_direct_message) || response.data[0];
        setActiveChannels([defaultChannel]);
        fetchChannelMessages(defaultChannel.id);
      }
    } catch (error) {
      console.error('Error fetching channels:', error);
      setError('Failed to load channels. Please try again later.');
    }
  };
  
  // Fetch messages for a channel
  const fetchChannelMessages = (channelId) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;
    
    sendWebSocketMessage({
      message_type: channel.is_direct_message ? 'get_direct_messages' : 'get_channel_messages',
      channel_id: channelId
    });
  };

  useEffect(() => {
    if (activeChannels.length > 0) {
      activeChannels.forEach((channel) => {
        if (!messagesMap[channel.id]) {
          fetchChannelMessages(channel.id);
        }
      });
    }
  }, [activeChannels, fetchChannelMessages, messagesMap, selectedChannelsForForward]);
  
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
        // Update messages for specific channel
        setMessagesMap(prevMap => ({
          ...prevMap,
          [data.channel_id]: data.messages
        }));
        break;
        
      case 'team_members':
        setTeamMembers(data.members);
        break;
        
      case 'interacted_users':
        setInteractedUsers(data.users);
        break;
      
      case 'message_deleted':
        // Update messages for all active channels
        setMessagesMap(prevMap => {
          const updatedMap = { ...prevMap };
          
          Object.keys(updatedMap).forEach(channelId => {
            updatedMap[channelId] = updatedMap[channelId].filter(
              msg => msg.id !== data.message_id
            );
          });
          
          return updatedMap;
        });
        break;
        
      case 'reaction_update':
        // Update reactions for all active channels
        setMessagesMap(prevMap => {
          const updatedMap = { ...prevMap };
          
          Object.keys(updatedMap).forEach(channelId => {
            updatedMap[channelId] = updatedMap[channelId].map(msg => 
              msg.id === data.message_id ? { ...msg, reactions: data.reactions } : msg
            );
          });
          
          return updatedMap;
        });
        break;

      case 'message_pinned':
        // Update messages for all active channels
        const message_id = data.message_id;
        const channel_id = data.channel_id;
        
        setMessagesMap(prevMap => {
          const updatedMap = { ...prevMap };
          Object.keys(updatedMap).forEach(channelId => {
            updatedMap[channel_id].find(msg => msg.id === message_id).is_pinned = true;
          });
          
          return updatedMap;
        });
        break; 
      
      case 'message_unpinned':
        // Update messages for all active channels
        const message_id_unpin = data.message_id;
        const channel_id_unpin = data.channel_id;
        setMessagesMap(prevMap => {
          const updatedMap = { ...prevMap };
          Object.keys(updatedMap).forEach(channelId => {
            updatedMap[channel_id_unpin].find(msg => msg.id === message_id_unpin).is_pinned = false;
          });
          
          return updatedMap;
        });
        break; 
        
      default:
        // Handle new message
        if (data.type === 'direct' || data.type === 'channels') {
          console.log('New message:', data);
          console.log('Active Channels : ', activeChannels);
          // Add the new message to the appropriate channel
          if (activeChannels.some(channel => channel.id === data.channel_id)) {
            setMessagesMap(prevMap => {
                const channelId = data.channel_id;
                const updatedMessages = [...(prevMap[channelId] || []), data];
                return {
                    ...prevMap,
                    [channelId]: updatedMessages
                };
            });
            console.log('Updated Messages for channel', data.channel_id);
          }
        }
        break;
    }
  };
  
  // Handle toggling a channel in active channels
  const handleChannelToggle = (channel) => {
    // Check if channel is already active
    const isActive = activeChannels.some(c => c.id === channel.id);
    
    if (isActive) {
      // Remove from active channels
      setActiveChannels(activeChannels.filter(c => c.id !== channel.id));
    } else {
      // Add to active channels if less than 3
      if (activeChannels.length < 3) {
        setActiveChannels([...activeChannels, channel]);
        // Fetch messages if not already loaded
        if (!messagesMap[channel.id]) {
          fetchChannelMessages(channel.id);
        }
      }
    }
    
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
      
      // Add to active channels if less than 3
      if (activeChannels.length < 3) {
        setActiveChannels(prev => [...prev.filter(c => c.id !== dmChannel.id), dmChannel]);
        fetchChannelMessages(dmChannel.id);
      }
      
      if (isMobile) {
        setMobileOpen(false);
      }
    } catch (error) {
      console.error('Error creating/getting DM channel:', error);
      setError('Failed to open direct message. Please try again.');
    }
  };
  
  const handleForwardMessage = (content) => {
    sendWebSocketMessage({
      message_type: 'forward_message',
      channels: selectedChannelsForForward,
      content: content
    })
  } 

  // Handle sending a message
  const handleSendMessage = (channelId, content, replyToId = null) => {
    console.log("Sending message : ", content, "Channel ID : ", channelId);
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;
    
    if (channel.is_direct_message) {
      // Get the other user's ID for direct messages
      const otherUserId = interactedUsers.find(
        user => user.channel_id === channel.id
      )?.id;
      
      if (otherUserId) {
        sendWebSocketMessage({
          message_type: 'direct_message',
          recipient_id: otherUserId,
          content: content,
          team_id: teamId,
          reply_to: replyToId,
          channel_id: channel.id
        });
      }
    } else {
      sendWebSocketMessage({
        message_type: 'channel_message',
        channel: channel.id,
        content: content,
        reply_to: replyToId
      });
    }
  };

  const pinMessage = (messageId) => {
    sendWebSocketMessage({
      message_type: 'pin_message',
      message_id: messageId
    });
  }

  const unpinMessage = (messageId) => {
    sendWebSocketMessage({
      message_type: 'unpin_message',
      message_id: messageId
    });
  }
  
  // Handle deleting a message
  const handleDeleteMessage = (channelId, messageId) => {
    const channel = channels.find(c => c.id === channelId);
    if (!channel) return;
    
    sendWebSocketMessage({
      message_type: 'delete_message',
      message_id: messageId,
      type: channel.is_direct_message ? 'direct' : 'channel'
    });
  };
  
  // Handle adding a reaction
  const handleReaction = (channelId, messageId, reaction) => {
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
  
  // Calculate grid sizing based on active channel count
  const getGridProps = (numChannels) => {
    switch (numChannels) {
      case 1:
        return { xs: 12 };
      case 2:
        return { xs: 12, md: 6 };
      case 3:
        return { xs: 12, md: 4 };
      default:
        return { xs: 12 };
    }
  };
  
  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      <CssBaseline />
      
      <Sidebar 
        channels={channels}
        teamMembers={teamMembers}
        interactedUsers={interactedUsers}
        activeChannels={activeChannels}
        onChannelToggle={handleChannelToggle}
        onCreateChannel={handleCreateChannel}
        onCreateOrGetDMChannel={handleCreateOrGetDMChannel}
        mobileOpen={mobileOpen}
        handleDrawerToggle={handleDrawerToggle}
        isMobile={isMobile}
        teamId={teamId}
      />
      
      <Box 
        component="main" 
        sx={{ 
          flexGrow: 1, 
          p: 1,
          height: '100vh',
          overflow: 'hidden',
          bgcolor: 'background.default'
        }}
      >
        {activeChannels.length === 0 ? (
          <Box sx={{ 
            display: 'flex', 
            justifyContent: 'center', 
            alignItems: 'center', 
            height: '100%',
            flexDirection: 'column',
            gap: 2
          }}>
            <Box sx={{ textAlign: 'center' }}>
              No channels selected. Choose up to 3 channels from the sidebar.
            </Box>
            <Button 
              variant="outlined" 
              onClick={handleDrawerToggle}
              sx={{ display: { md: 'none' } }}
            >
              Open Sidebar
            </Button>
          </Box>
        ) : (
          <Grid container spacing={1} sx={{ height: '100%' }}>
            {activeChannels.map((channel) => (
              <Grid 
                item 
                key={channel.id} 
                {...getGridProps(activeChannels.length)}
                sx={{ height: '100%' }}
              >
                <MessageWindow 
                  messages={messagesMap[channel.id] || []}
                  selectedChannel={channel}
                  teamMembers={teamMembers}
                  onSendMessage={(content, replyToId) => 
                    handleSendMessage(channel.id, content, replyToId)
                  }
                  forwardMessage={handleForwardMessage}
                  onDeleteMessage={(messageId) => 
                    handleDeleteMessage(channel.id, messageId)
                  }
                  onReact={(messageId, reaction) => 
                    handleReaction(channel.id, messageId, reaction)
                  }
                  handleDrawerToggle={handleDrawerToggle}
                  loading={loading && !messagesMap[channel.id]}
                  error={error}
                  onClose={() => handleChannelToggle(channel)}
                  isMultiWindow={activeChannels.length > 1}
                  channels={channels}
                  setSelectedChannelsForForward={setSelectedChannelsForForward}
                  selectedChannelsForForward={selectedChannelsForForward}
                  pinMessage={pinMessage}
                  unpinMessage={unpinMessage}
                />
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Box>
  );
};

export default ChatInterface;