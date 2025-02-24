import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  IconButton,
  Chip,
  Avatar,
  InputAdornment,
  Tooltip,
  Modal,
  Menu,
  MenuItem,
  Stack 
} from '@mui/material';
import {
  Send as SendIcon,
  Reply as ReplyIcon,
  EmojiEmotions as EmojiIcon,
  MoreVert as MoreVertIcon // Import MoreVertIcon for the three dots
} from '@mui/icons-material';
import EmojiPicker from 'emoji-picker-react'; // Joypixels integration
// import joypixels from 'joypixels';

function MessageWindow({ messages, selectedChat, onSendMessage, isConnected, onReactMessage }) {
  const [newMessage, setNewMessage] = useState('');
  const [replyTo, setReplyTo] = useState(null);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null); // Anchor for the menu
  const [selectedMessageForMenu, setSelectedMessageForMenu] = useState(null); // Track which message's menu is open

  const scrollToBottom = useCallback(() => {
    if (shouldAutoScroll) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [shouldAutoScroll]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleScroll = () => {
    if (messagesContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      setShouldAutoScroll(isNearBottom);
    }
  };

  const MessageReactions = ({ reactions }) => {
    if (!reactions || Object.keys(reactions).length === 0) return null;
  
    // Group reactions by emoji
    const groupedReactions = Object.entries(reactions).reduce((acc, [username, emoji]) => {
      acc[emoji] = acc[emoji] || { emoji, users: [], count: 0 };
      acc[emoji].users.push(username);
      acc[emoji].count += 1;
      return acc;
    }, {});
  
    return (
      <Stack direction="row" spacing={0.5} sx={{ mt: 0.5 }}>
        {Object.values(groupedReactions).map(({ emoji, users, count }) => (
          <Tooltip
            key={emoji}
            title={users.join(', ')}
            placement="bottom"
          >
            <Chip
              label={`${emoji} ${count}`}
              size="small"
              sx={{
                height: 20,
                fontSize: '0.75rem',
                backgroundColor: 'rgba(0, 0, 0, 0.08)',
                '&:hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.12)',
                }
              }}
            />
          </Tooltip>
        ))}
      </Stack>
    );
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (newMessage.trim()) {
      var temp = replyTo?.id;
      onSendMessage(newMessage, temp);
      setNewMessage('');
      setReplyTo(null);
      setShouldAutoScroll(true);
    }
  };

  const handleReply = (message) => {
    setReplyTo(message);
    setShouldAutoScroll(true);
    handleCloseMenu(); // Close the menu after replying
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleReact = (message, emoji) => {
    onReactMessage(message.id, emoji, message.message_type);
    setShowEmojiPicker(false);
    handleCloseMenu(); // Close the menu after reacting
  };

  const handleEmojiToggle = () => {
    setShowEmojiPicker((prev) => !prev);
  };

  const handleEmojiSelect = (emojiObject) => {
    if (selectedMessageForMenu) {
      handleReact(selectedMessageForMenu, emojiObject.emoji);
      setShowEmojiPicker(false);
    } else {
      setNewMessage((prev) => prev + emojiObject.emoji);
    }
  };
  // Menu handling functions
  const handleOpenMenu = (event, message) => {
    setAnchorEl(event.currentTarget);
    setSelectedMessageForMenu(message);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
    setSelectedMessageForMenu(null);
  };


  if (!selectedChat) {
    return (
      <Box
        className="message-window"
        sx={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%'
        }}
      >
        <Typography color="text.secondary">
          Select a channel or user to start chatting
        </Typography>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        bgcolor: 'background.paper',
        borderRadius: 1,
        overflow: 'hidden'
      }}
    >
      <Paper
        elevation={2}
        sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: 1,
          borderColor: 'divider'
        }}
      >
        <Typography variant="subtitle1" noWrap>
          {selectedChat?.type === 'channel'
            ? `# ${selectedChat.name}`
            : selectedChat?.username || 'Select a chat'}
        </Typography>
        <Chip
          label={isConnected ? 'Connected' : 'Disconnected'}
          color={isConnected ? 'success' : 'error'}
          size="small"
        />
      </Paper>

      <Box
        ref={messagesContainerRef}
        onScroll={handleScroll}
        sx={{
          flex: 1,
          overflowY: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 0.5
        }}
      >
        {messages.length === 0 ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: '100%'
            }}
          >
            <Typography color="text.secondary">No messages yet</Typography>
          </Box>
        ) : (
          messages.map((message, index) => {
            const isOwnMessage = message.sender === localStorage.getItem('username');
            const showSender = index === 0 || messages[index - 1].sender !== message.sender;
            const showReply = !!message.reply_to;
            return (
              <Box
                key={message.id || index}
                sx={{
                  alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
                  maxWidth: '50%'
                }}
              >
                {showReply && (
                  <Paper elevation={0} sx={{ pl: 2, mb: 0.5, bgcolor: 'grey.200' }}>
                    <Typography variant="caption">{`Replying to: ${message.replied_message}`}</Typography>
                  </Paper>
                )}
                {showSender && (
                  <Typography
                    variant="subtitle2"
                    sx={{ ml: 1, mb: 0.25, display: 'block' }}
                  >
                    {message.sender.toString() || 'Unknown'}
                  </Typography>
                )}
                <Paper
                  elevation={1}
                  sx={{
                    py: 0.75,
                    px: 1.5,
                    bgcolor: isOwnMessage ? 'primary.main' : 'grey.100',
                    color: isOwnMessage ? 'white' : 'text.primary',
                    borderRadius: 2,
                  }}
                >
                  <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <Typography variant="body2">{message.content}</Typography>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', ml: 2 }}>
                        <Typography
                          variant="caption"
                          sx={{
                            display: 'block',
                            opacity: 0.8,
                            fontSize: '0.7rem'
                          }}
                        >
                          {formatTimestamp(message.timestamp)}
                        </Typography>
                        <IconButton
                          size="small"
                          onClick={(e) => handleOpenMenu(e, message)}
                          sx={{ padding: 0.25 }}
                        >
                          <MoreVertIcon fontSize="small" />
                        </IconButton>
                      </Box>
                    </Box>
                    <MessageReactions reactions={message.reactions} />
                  </Box>
                </Paper>
              </Box>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </Box>

      {/* Reply Context */}
      {replyTo && (
        <Paper sx={{ p: 1, bgcolor: 'grey.300', display: 'flex', justifyContent: 'space-between' }}>
          <Typography variant="body2">{`Replying to: ${replyTo.content}`}</Typography>
          <Button size="small" onClick={() => setReplyTo(null)}>
            Cancel
          </Button>
        </Paper>
      )}
      <Paper
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 1.5,
          borderTop: 1,
          borderColor: 'divider',
          display: 'flex',
          gap: 1
        }}
      >
        <TextField
          fullWidth
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          placeholder={isConnected ? "Type a message..." : "Connecting..."}
          disabled={!isConnected}
          variant="outlined"
          size="small"
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <Tooltip title="Emoji">
                  <IconButton onClick={handleEmojiToggle}>
                    <EmojiIcon />
                  </IconButton>
                </Tooltip>
                <IconButton
                  type="submit"
                  disabled={!isConnected || !newMessage.trim()}
                  color="primary"
                >
                  <SendIcon />
                </IconButton>
              </InputAdornment>
            )
          }}
        />
      </Paper>

      <Modal
        open={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1300, // Ensure it's above other elements
        }}
      >
        <Box
          sx={{
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: 24,
            p: 2,
            transform: 'scale(1.2)', // Make it bigger
            overflow: 'hidden', // Prevent the picker from overflowing the box
          }}
        >
          <EmojiPicker
            onEmojiClick={handleEmojiSelect}
            width={480}
            height={460}
          />
        </Box>
      </Modal>

      {/* Menu Component */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleCloseMenu}
      >
        <MenuItem onClick={() => handleReply(selectedMessageForMenu)}>
          <ReplyIcon sx={{ mr: 1 }} fontSize="small" />
          Reply
        </MenuItem>
        <MenuItem onClick={() => setShowEmojiPicker(true)}>
          <EmojiIcon sx={{ mr: 1 }} fontSize="small" />
          React
        </MenuItem>
      </Menu>
    </Box>
  );
}

export default MessageWindow;
