import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  CardActions,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Snackbar,
  Alert,
  Box,
  Chip,
  IconButton,
  Paper,
  AppBar,
  Toolbar,
  Menu,
  MenuItem,
  Avatar
} from '@mui/material';
import {
  Add as AddIcon,
  Groups as GroupsIcon,
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  Launch as LaunchIcon,
  KeyboardArrowDown as ArrowDownIcon
} from '@mui/icons-material';

// Animated background component
const AnimatedBackground = () => {
  return (
    <Box
      component="div"
      sx={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        overflow: 'hidden',
        pointerEvents: 'none',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(45deg, rgba(25, 118, 210, 0.05), rgba(66, 165, 245, 0.05))',
        }
      }}
    >
      {[...Array(80)].map((_, i) => (
        <Box
          key={i}
          component="div"
          sx={{
            position: 'absolute',
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'primary.main',
            opacity: 0.2,
            top: `${Math.random() * 100}%`,
            left: `-20px`,
            animation: `floatRight 10s linear infinite`,
            animationDelay: `${Math.random() * -15}s`,
            '@keyframes floatRight': {
              '0%': {
                transform: 'translateX(0)',
                opacity: 0,
              },
              '10%': {
                opacity: 0.2,
              },
              '90%': {
                opacity: 0.2,
              },
              '100%': {
                transform: 'translateX(calc(100vw + 20px))',
                opacity: 0,
              }
            }
          }}
        />
      ))}
    </Box>
  );
};

// Header component (keeping the original gradient style)
const Header = ({ username, setIsAuthenticated }) => {
  const [anchorEl, setAnchorEl] = useState(null);
  const navigate = useNavigate();
  
  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('username');
    setIsAuthenticated(false);
    navigate('/login');
  };

  return (
    <AppBar position="fixed" color="default" elevation={1}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Typography
            variant="h4"
            component="div"
            sx={{
              fontWeight: 700,
              background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            SynQ
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Button
            onClick={handleMenu}
            endIcon={<ArrowDownIcon />}
            sx={{ textTransform: 'none' }}
          >
            <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
              {username?.[0]?.toUpperCase()}
            </Avatar>
            {username}
          </Button>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
          >
            <MenuItem disabled onClick={handleClose}>Profile</MenuItem>
            <MenuItem onClick={handleLogout}>Logout</MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
const TeamManagement = ({ setIsAuthenticated }) => {
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

  const handleCloseSnackbar = () => {
    setError('');
    setSuccess('');
  };

  const copyInviteCode = (code) => {
    navigator.clipboard.writeText(code);
    setSuccess('Invitation code copied to clipboard!');
  };
  const username = localStorage.getItem('username');

  return (
    <>
      <Header username={username} setIsAuthenticated={setIsAuthenticated} />
      <AnimatedBackground />
      <Box sx={{ pt: '84px' }}> {/* Add padding to account for fixed header */}
        <Container maxWidth="lg" sx={{ py: 4 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 'bold' }}>
              Team Management
            </Typography>
            <Box>
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setShowCreateDialog(true)}
                sx={{ mr: 2 }}
              >
                Create Team
              </Button>
              <Button
                variant="outlined"
                startIcon={<GroupsIcon />}
                onClick={() => setShowJoinDialog(true)}
              >
                Join Team
              </Button>
            </Box>
          </Box>

      <Grid container spacing={3}>
        {teams.map(team => (
          <Grid item xs={12} md={6} lg={4} key={team.id}>
            <Card 
              elevation={3}
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)'
                }
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Typography variant="h5" component="h2" gutterBottom>
                  {team.name}
                </Typography>
                
                {invitations[team.id]?.length > 0 && (
                  <Box mt={2}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Active Invitations
                    </Typography>
                    {invitations[team.id].map(invite => (
                      <Box
                        key={invite.invite_code}
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          mb: 1,
                          backgroundColor: 'grey.100',
                          borderRadius: 1,
                          p: 1
                        }}
                      >
                        <Chip
                          label={invite.invite_code}
                          size="small"
                          sx={{ mr: 1 }}
                        />
                        <IconButton
                          size="small"
                          onClick={() => copyInviteCode(invite.invite_code)}
                          sx={{ mr: 1 }}
                        >
                          <ContentCopyIcon fontSize="small" />
                        </IconButton>
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => revokeInvitation(team.id, invite.invite_code)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    ))}
                  </Box>
                )}
              </CardContent>
              
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  startIcon={<LaunchIcon />}
                  onClick={() => navigate(`/chat/${team.id}`)}
                  fullWidth
                  sx={{ mb: 1 }}
                >
                  Open Chat
                </Button>
                <Button
                  size="small"
                  onClick={() => createInvitation(team.id)}
                  sx={{ mr: 1 }}
                >
                  Create Invitation
                </Button>
                <Button
                  size="small"
                  onClick={() => fetchInvitations(team.id)}
                >
                  Show Invitations
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Create Team Dialog */}
      <Dialog open={showCreateDialog} onClose={() => setShowCreateDialog(false)}>
        <DialogTitle>Create New Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Team Name"
            fullWidth
            variant="outlined"
            value={newTeamName}
            onChange={(e) => setNewTeamName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowCreateDialog(false)}>Cancel</Button>
          <Button onClick={createTeam} variant="contained">Create</Button>
        </DialogActions>
      </Dialog>

      {/* Join Team Dialog */}
      <Dialog open={showJoinDialog} onClose={() => setShowJoinDialog(false)}>
        <DialogTitle>Join Team</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Invitation Code"
            fullWidth
            variant="outlined"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowJoinDialog(false)}>Cancel</Button>
          <Button onClick={joinTeam} variant="contained">Join</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={!!error || !!success}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={error ? "error" : "success"}
          sx={{ width: '100%' }}
        >
          {error || success}
        </Alert>
      </Snackbar>
    </Container>
    </Box>
      <AnimatedBackground />
    </>
  );
};


export default TeamManagement;
