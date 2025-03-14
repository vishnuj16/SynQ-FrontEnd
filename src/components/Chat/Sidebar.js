import React, { useState } from 'react';
import {
  Box,
  Drawer,
  Divider,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  TextField,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Toolbar,
  Avatar,
  Collapse,
  Menu,
  MenuItem,
  Tooltip,
  Badge,
  Paper,
} from '@mui/material';
import {
  Tag as TagIcon,
  AddCircleOutline as AddCircleOutlineIcon,
  Person as PersonIcon,
  ExpandLess,
  ExpandMore,
  Chat as ChatIcon,
  Lock as LockIcon,
  Menu as MenuIcon,
  Search as SearchIcon,
  Add as AddIcon,
  AccountCircle as AccountCircleIcon,
  Message as MessageIcon,
  Chat,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import PresenceIndicator from './PresenceIndicator';

// Drawer width for desktop view
const drawerWidth = 280;

const Sidebar = ({
  channels,
  teamMembers,
  interactedUsers,
  activeChannels, // Changed from selectedChannel
  onChannelToggle, // Changed from onChannelSelect
  onCreateChannel,
  onCreateOrGetDMChannel,
  mobileOpen,
  handleDrawerToggle,
  isMobile,
  teamId,
  userPresences,
}) => {
  const navigate = useNavigate();
  const currentUserId = localStorage.getItem('user_id');

  // State variables for UI elements
  const [channelDialogOpen, setChannelDialogOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState('');
  const [showChannels, setShowChannels] = useState(true);
  const [showDirectMessages, setShowDirectMessages] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');

  // State for new conversation dropdown menu
  const [dmMenuAnchorEl, setDmMenuAnchorEl] = useState(null);
  const isDmMenuOpen = Boolean(dmMenuAnchorEl);

  // State for settings menu
  const [settingsAnchorEl, setSettingsAnchorEl] = useState(null);
  const isSettingsMenuOpen = Boolean(settingsAnchorEl);

  // Get non-DM channels
  const groupChannels = channels.filter((c) => !c.is_direct_message);

  // Get DM channels
  const dmChannels = channels.filter((c) => c.is_direct_message);

  // Handle channel creation
  const handleCreateChannelClick = () => {
    if (newChannelName.trim()) {
      onCreateChannel(newChannelName.trim());
      setNewChannelName('');
      setChannelDialogOpen(false);
    }
  };

  // Handle logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user_id');
    localStorage.removeItem('username');
    navigate('/login');
  };

  // Handle team selection navigation
  const handleTeamSelection = () => {
    navigate('/teams');
    handleSettingsMenuClose();
  };

  // Find user name for DM channel display
  const getDMChannelName = (channel) => {
    const dmUser = interactedUsers.find((user) => user.channel_id === channel.id);
    return dmUser ? dmUser.username : channel.name;
  };

  // Get all team members that aren't already in a DM and not the current user
  const getAvailableDMUsers = () => {
    // Get IDs of users already in DMs
    const currentDMUserIds = interactedUsers.map((user) => user.id);
    console.log("interacted Users : ", interactedUsers)
    console.log("current DM USer IDS : ", currentDMUserIds);
    console.log("teamMembers : ", teamMembers);

    // Filter out current user and users already in DMs
    return teamMembers.filter(
      (member) => member.id.toString() !== currentUserId && !currentDMUserIds.includes(member.id)
    );
  };

  // Open conversation dropdown menu
  const handleDmMenuOpen = (event) => {
    setDmMenuAnchorEl(event.currentTarget);
  };

  // Close conversation dropdown menu
  const handleDmMenuClose = () => {
    setDmMenuAnchorEl(null);
  };

  // Create a new DM with a team member
  const startNewDM = async (userId) => {
    onCreateOrGetDMChannel(userId);
    handleDmMenuClose();
  };

  // Filter channels by search query
  const filterItems = (items, getItemName) => {
    if (!searchQuery) return items;
    return items.filter((item) => getItemName(item).toLowerCase().includes(searchQuery.toLowerCase()));
  };

  const filteredGroupChannels = filterItems(groupChannels, (channel) => channel.name);
  const filteredDmChannels = filterItems(dmChannels, (channel) => getDMChannelName(channel));

  // Check if a channel is active
  const isChannelActive = (channelId) => {
    return activeChannels.some(channel => channel.id === channelId);
  };

  // Count active channels
  const activeChannelCount = activeChannels.length;

  // Settings menu open
  const handleSettingsMenuOpen = (event) => {
    setSettingsAnchorEl(event.currentTarget);
  };

  //Settings menu close
  const handleSettingsMenuClose = () => {
    setSettingsAnchorEl(null);
  };

  // Sidebar content shared between mobile and desktop views
  const drawerContent = (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: 'background.paper',
      }}
    >
      <Toolbar
        sx={{
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider',
          px: 2,
        }}
      >
        <Typography
          variant="h4"
          component="span"
          fontWeight="bold"
          sx={{
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          <Chat sx={{ fontSize: 25, color: 'primary.main' }} /> SynQ
        </Typography>
        {isMobile && (
          <IconButton onClick={handleDrawerToggle} edge="end">
            <MenuIcon />
          </IconButton>
        )}
      </Toolbar>

      <Box sx={{ px: 2, py: 1.5 }}>
        <TextField
          fullWidth
          placeholder="Search channels & messages"
          size="small"
          variant="outlined"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
            sx: { borderRadius: 2 },
          }}
        />
      </Box>

      {/* Active Channel Count */}
      <Box sx={{ px: 2, mb: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Active channels: {activeChannelCount}/3
        </Typography>
      </Box>

      <Box sx={{ flexGrow: 1, overflow: 'auto', px: 1 }}>
        {/* Channels Section */}
        <ListItem
          disablePadding
          sx={{
            mb: 1,
            borderRadius: 3,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <ListItemButton onClick={() => setShowChannels(!showChannels)} sx={{ borderRadius: 3 }}>
            <ListItemText primary="Channels" primaryTypographyProps={{ fontWeight: 600 }} />
            {showChannels ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>
          <Tooltip title="Create new channel">
            <IconButton size="small" onClick={() => setChannelDialogOpen(true)} sx={{ mr: 1 }}>
              <AddCircleOutlineIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </ListItem>

        <Collapse in={showChannels} timeout="auto" unmountOnExit>
          <List component="div" disablePadding sx={{ mb: 1 }}>
            {filteredGroupChannels.length > 0 ? (
              filteredGroupChannels.map((channel) => (
                <ListItem key={channel.id} disablePadding>
                  <ListItemButton
                    selected={isChannelActive(channel.id)}
                    onClick={() => onChannelToggle(channel)}
                    sx={{
                      pl: 3,
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        bgcolor: 'primary.light',
                        '&:hover': {
                          bgcolor: 'primary.light',
                        },
                      },
                    }}
                    disabled={activeChannelCount >= 3 && !isChannelActive(channel.id)}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      {channel.channel_type === 'private' ? (
                        <LockIcon fontSize="small" color="action" />
                      ) : (
                        <TagIcon fontSize="small" color="primary" />
                      )}
                    </ListItemIcon>
                    <ListItemText
                      primary={channel.name}
                      primaryTypographyProps={{
                        noWrap: true,
                        fontSize: '0.95rem',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            ) : (
              <ListItem sx={{ pl: 3 }}>
                <ListItemText
                  primary="No channels found"
                  primaryTypographyProps={{
                    variant: 'body2',
                    color: 'text.secondary',
                    fontSize: '0.9rem',
                  }}
                />
              </ListItem>
            )}
          </List>
        </Collapse>

        {/* Direct Messages Section */}
        <ListItem
          disablePadding
          sx={{
            mt: 1,
            borderRadius: 1,
            '&:hover': { bgcolor: 'action.hover' },
          }}
        >
          <ListItemButton onClick={() => setShowDirectMessages(!showDirectMessages)} sx={{ borderRadius: 1 }}>
            <ListItemText primary="Direct Messages" primaryTypographyProps={{ fontWeight: 600 }} />
            {showDirectMessages ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>

          <Tooltip title="Start new conversation">
            <IconButton
              size="small"
              onClick={handleDmMenuOpen}
              sx={{ mr: 1 }}
              disabled={getAvailableDMUsers().length === 0 || activeChannelCount >= 3}
              color="primary"
            >
              <MessageIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={dmMenuAnchorEl}
            open={isDmMenuOpen}
            onClose={handleDmMenuClose}
            PaperProps={{
              sx: { width: 220, maxHeight: 300 },
            }}
          >
            <Typography variant="subtitle2" sx={{ px: 2, py: 1, color: 'text.secondary' }}>
              Start a conversation
            </Typography>
            <Divider />

            {getAvailableDMUsers().length > 0 ? (
              getAvailableDMUsers().map((member) => (
                <MenuItem key={member.id} onClick={() => startNewDM(member.id)} sx={{ py: 1 }}>
                  <Avatar sx={{ width: 28, height: 28, mr: 1.5, bgcolor: 'primary.main' }}>
                    {member.username?.charAt(0).toUpperCase()}
                  </Avatar>
                  <Typography variant="body2">
                    {member.username}
                    <PresenceIndicator status={userPresences[member.id]?.status || 'offline'} timestamp={userPresences[member.id]?.timestamp} size={10} />
                  </Typography>
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>
                <Typography variant="body2" color="text.secondary">
                  No more users available
                </Typography>
              </MenuItem>
            )}
          </Menu>
        </ListItem>

        <Collapse in={showDirectMessages} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {filteredDmChannels.length > 0 ? (
              filteredDmChannels.map((channel) => (
                <ListItem key={channel.id} disablePadding>
                  <ListItemButton
                    selected={isChannelActive(channel.id)}
                    onClick={() => onChannelToggle(channel)}
                    sx={{
                      pl: 3,
                      borderRadius: 1,
                      mb: 0.5,
                      '&.Mui-selected': {
                        bgcolor: 'primary.light',
                        '&:hover': {
                          bgcolor: 'primary.light',
                        },
                      },
                    }}
                    disabled={activeChannelCount >= 3 && !isChannelActive(channel.id)}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Avatar sx={{ width: 24, height: 24, fontSize: '0.75rem', bgcolor: 'secondary.light' }}>
                        {getDMChannelName(channel)?.charAt(0).toUpperCase()}
                      </Avatar>
                    </ListItemIcon>
                    <ListItemText
                      primary={getDMChannelName(channel)}
                      primaryTypographyProps={{
                        noWrap: true,
                        fontSize: '0.95rem',
                      }}
                    />
                  </ListItemButton>
                </ListItem>
              ))
            ) : (
              <ListItem sx={{ pl: 3 }}>
                <ListItemText
                  primary="No direct messages found"
                  primaryTypographyProps={{
                    variant: 'body2',
                    color: 'text.secondary',
                    fontSize: '0.9rem',
                  }}
                />
              </ListItem>
            )}
          </List>
        </Collapse>
      </Box>

      {/* Settings Section */}
      <Box p={2} sx={{ borderTop: 1, borderColor: 'divider', mt: 1 }}>
        <Button
          variant="contained"
          fullWidth
          onClick={handleSettingsMenuOpen}
          color="secondary"
          sx={{
            borderRadius: 2,
            textTransform: 'none',
            py: 1,
          }}
          startIcon={<SettingsIcon />}
        >
          Settings
        </Button>

        <Menu
          anchorEl={settingsAnchorEl}
          open={isSettingsMenuOpen}
          onClose={handleSettingsMenuClose}
          PaperProps={{
            sx: {
              width: 220,
              borderRadius: 2,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
              mt: 1,
              py: 1,
            },
          }}
          TransitionProps={{
            onEntering: (node) => {
              node.style.transformOrigin = 'top right';
            },
          }}
        >
          <MenuItem
            onClick={handleLogout}
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ListItemIcon>
              <AccountCircleIcon fontSize="small" />
            </ListItemIcon>
            <Typography variant="body2" fontWeight={500}>
              Logout
            </Typography>
          </MenuItem>
          <MenuItem
            onClick={handleTeamSelection}
            sx={{
              px: 2,
              py: 1.5,
              borderRadius: 1,
              '&:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            }}
          >
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <Typography variant="body2" fontWeight={500}>
              Team Selection
            </Typography>
          </MenuItem>
        </Menu>

      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile drawer */}
      {isMobile && (
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 1,
              borderColor: 'divider',
            },
          }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Desktop drawer */}
      {!isMobile && (
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: drawerWidth,
              borderRight: 1,
              borderColor: 'divider',
            },
            width: drawerWidth,
            flexShrink: 0,
          }}
          open
        >
          {drawerContent}
        </Drawer>
      )}

      {/* Channel creation dialog */}
      <Dialog open={channelDialogOpen} onClose={() => setChannelDialogOpen(false)}>
        <DialogTitle>Create a new channel</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Channel Name"
            type="text"
            fullWidth
            variant="outlined"
            value={newChannelName}
            onChange={(e) => setNewChannelName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setChannelDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleCreateChannelClick} variant="contained" color="primary">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Sidebar;