import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Drawer,
  List,
  ListItemText,
  ListItemIcon,
  ListItemButton,
  Divider,
  Typography,
  TextField,
  IconButton,
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Avatar,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Tag as TagIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Chat,
  Settings as SettingsIcon,
  Logout as LogoutIcon,
  SwapHoriz as SwapTeamIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';

const DRAWER_WIDTH = 280;

// Animated logo component
const AnimatedLogo = () => (
  <motion.div
    initial={{ scale: 0.5, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    transition={{ duration: 0.5 }}
  >
    <Box sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 1,
      mb: 3,
      mt: 2
    }}>
      <Chat sx={{ fontSize: 40, color: 'primary.main' }} />
      <Typography 
        variant="h4" 
        component="span" 
        fontWeight="bold"
        sx={{
          background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent'
        }}
      >
        SynQ
      </Typography>
    </Box>
  </motion.div>
);

const Sidebar = ({ channels, interactedUsers, selectedChat, onSelectChat, teamId, setIsAuthenticated }) => {
  const navigate = useNavigate();
  const [newChannelName, setNewChannelName] = useState('');
  const [allUsers, setAllUsers] = useState([]);
  const [showUserList, setShowUserList] = useState(false);
  const [showCreateChannel, setShowCreateChannel] = useState(false);
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);

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

  const isSelected = (item) => {
    if (!selectedChat) return false;
    return selectedChat.id === item.id && selectedChat.type === (item.type || 'channel');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    navigate('/login');
    setSettingsAnchorEl(null);
  };

  const handleSwitchTeams = () => {
    navigate('/teams');
    setSettingsAnchorEl(null);
  };

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
          Authorization: `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ 
          name: newChannelName, 
          team: teamId
        }),
      });

      if (response.ok) {
        const newChannel = await response.json();
        channels.push(newChannel);
        setNewChannelName("");
        setShowCreateChannel(false); // Close dialog after creation
      } else {
        console.error('Failed to add channel');
      }
    } catch (error) {
      console.error('Error adding channel:', error);
    }
  }

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: DRAWER_WIDTH,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          bgcolor: '#f8f9fa',
          borderRight: '1px solid rgba(0, 0, 0, 0.12)',
          display: 'flex',
          flexDirection: 'column'
        }
      }}
    >
      <AnimatedLogo />
      
      <Box sx={{ 
        p: 2,
        flex: 1,
        overflowY: 'auto',
        background: 'linear-gradient(180deg, rgba(255,255,255,0.9) 0%, rgba(248,249,250,0.9) 100%)'
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          p: 1,
          borderRadius: 1,
          bgcolor: 'rgba(33, 150, 243, 0.1)'
        }}>
          <Typography variant="h6" sx={{ flex: 1, color: '#1976d2' }}>Channels</Typography>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <IconButton 
              size="small" 
              onClick={() => setShowCreateChannel(true)}
              sx={{ color: '#1976d2' }}
            >
              <AddIcon />
            </IconButton>
          </motion.div>
        </Box>

        <List dense>
          <AnimatePresence>
            {channels.map(channel => (
              <motion.div
                key={channel.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ListItemButton
                  selected={isSelected(channel)}
                  onClick={() => onSelectChat({ type: 'channel', ...channel })}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      }
                    },
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.08)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <TagIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={channel.name} />
                </ListItemButton>
              </motion.div>
            ))}
          </AnimatePresence>
        </List>

        <Divider sx={{ my: 2 }} />

        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          mb: 2,
          p: 1,
          borderRadius: 1,
          bgcolor: 'rgba(33, 150, 243, 0.1)'
        }}>
          <Typography variant="h6" sx={{ flex: 1, color: '#1976d2' }}>Direct Messages</Typography>
          <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
            <IconButton 
              size="small" 
              onClick={() => setShowUserList(!showUserList)}
              sx={{ color: '#1976d2' }}
            >
              <AddIcon />
            </IconButton>
          </motion.div>
        </Box>

        <List dense>
          <AnimatePresence>
            {interactedUsers.map(user => (
              <motion.div
                key={user.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                <ListItemButton
                  selected={isSelected({ ...user, type: 'direct' })}
                  onClick={() => onSelectChat({ type: 'direct', ...user })}
                  sx={{
                    borderRadius: 1,
                    mb: 0.5,
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      color: 'white',
                      '&:hover': {
                        bgcolor: 'primary.dark',
                      },
                      '& .MuiListItemIcon-root': {
                        color: 'white',
                      }
                    },
                    '&:hover': {
                      bgcolor: 'rgba(25, 118, 210, 0.08)',
                    }
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Avatar sx={{ width: 24, height: 24, fontSize: '0.875rem' }}>
                      {user.username[0].toUpperCase()}
                    </Avatar>
                  </ListItemIcon>
                  <ListItemText primary={user.username} />
                </ListItemButton>
              </motion.div>
            ))}
          </AnimatePresence>
        </List>
      </Box>

      {/* Settings Button */}
      <Box sx={{ 
        p: 2, 
        borderTop: '1px solid rgba(0, 0, 0, 0.12)',
        bgcolor: 'background.paper'
      }}>
        <motion.div whileHover={{ scale: 1.05 }}>
          <IconButton 
            onClick={(e) => setSettingsAnchorEl(e.currentTarget)}
            sx={{ 
              width: '100%',
              bgcolor: 'rgba(33, 150, 243, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(33, 150, 243, 0.2)',
              }
            }}
          >
            <SettingsIcon sx={{ color: '#1976d2' }} />
          </IconButton>
        </motion.div>
      </Box>

      {/* Settings Menu */}
      <Menu
        anchorEl={settingsAnchorEl}
        open={Boolean(settingsAnchorEl)}
        onClose={() => setSettingsAnchorEl(null)}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
      >
        <MenuItem onClick={handleSwitchTeams}>
          <ListItemIcon>
            <SwapTeamIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Switch Teams" />
        </MenuItem>
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText primary="Logout" />
        </MenuItem>
      </Menu>

      {/* Create Channel Dialog */}
      <Dialog 
        open={showCreateChannel} 
        onClose={() => setShowCreateChannel(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
          }
        }}
      >
        <DialogTitle>Create New Channel</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Channel Name"
            fullWidth
            variant="outlined"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateChannel(false)}>Cancel</Button>
          <Button 
            onClick={createNewChannel} 
            variant="contained"
            sx={{
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            }}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* User List Dialog */}
      <Dialog 
        open={showUserList} 
        onClose={() => setShowUserList(false)}
        PaperProps={{
          sx: {
            borderRadius: 2,
            bgcolor: 'background.paper',
          }
        }}
      >
        <DialogTitle>Start New Conversation</DialogTitle>
        <DialogContent>
          <List>
            <AnimatePresence>
              {allUsers.map((user) => (
                <motion.div
                  key={user.id}
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <ListItemButton
                    onClick={() => sendMessage(user)}
                    sx={{
                      borderRadius: 1,
                      mb: 0.5,
                      '&:hover': {
                        bgcolor: 'rgba(25, 118, 210, 0.08)',
                      }
                    }}
                  >
                    <ListItemIcon>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        {user.username[0].toUpperCase()}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText primary={user.username} />
                  </ListItemButton>
                </motion.div>
              ))}
            </AnimatePresence>
          </List>
        </DialogContent>
      </Dialog>
    </Drawer>
  );
};

export default Sidebar;