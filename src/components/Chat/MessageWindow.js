import React, { useState, useRef, useEffect } from 'react';
import {
    Box,
    Typography,
    TextField,
    IconButton,
    Paper,
    Toolbar,
    AppBar,
    Avatar,
    Menu,
    Modal,
    MenuItem,
    Stack,
    Tooltip,
    CircularProgress,
    Alert,
    InputAdornment,
    Card,
    CardContent,
    Chip,
    Divider,
    List,
    ListItemIcon,
    ListItemAvatar,
    ListItemText
} from '@mui/material';
import {
    Send as SendIcon,
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Reply as ReplyIcon,
    Tag as TagIcon,
    Person as PersonIcon,
    Menu as MenuIcon,
    EmojiEmotions as EmojiIcon,
    MoreHoriz as MoreHorizIcon,
    Close as CloseIcon,
    ChatBubble as ChatBubbleIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
// Add dayjs plugins
dayjs.extend(relativeTime);

const MessageWindow = ({
    messages,
    selectedChannel,
    teamMembers,
    onSendMessage,
    onDeleteMessage,
    onReact,
    handleDrawerToggle,
    loading,
    error,
    onClose,
    isMultiWindow
}) => {
    // State variables
    const [messageText, setMessageText] = useState('');
    const [replyTo, setReplyTo] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [emojiAnchorEl, setEmojiAnchorEl] = useState(null);
    const [emojiTargetMessage, setEmojiTargetMessage] = useState(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

    // Refs
    const messagesEndRef = useRef(null);
    const messageContainerRef = useRef(null);
    const messageInputRef = useRef(null);

    // Get username from local storage
    const username = localStorage.getItem('username');

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current && shouldAutoScroll) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, shouldAutoScroll]);

    // Focus input field when reply is set
    useEffect(() => {
        if (replyTo && messageInputRef.current) {
            messageInputRef.current.focus();
        }
    }, [replyTo]);

    const handleScroll = () => {
        if (messageContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShouldAutoScroll(isNearBottom);
        }
    };
    
    // Handle send message
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (messageText.trim()) {
            onSendMessage(messageText, replyTo?.id);
            setMessageText('');
            setReplyTo(null);
        }
    };

    // Handle message context menu
    const handleMessageOptionsClick = (event, message) => {
        setAnchorEl(event.currentTarget);
        setSelectedMessage(message);
    };

    // Close message context menu
    const handleContextMenuClose = () => {
        setAnchorEl(null);
        setSelectedMessage(null);
    };

    // Handle delete message
    const handleDeleteMessage = () => {
        if (selectedMessage) {
            onDeleteMessage(selectedMessage.id);
            handleContextMenuClose();
        }
    };

    // Handle reply to message
    const handleReplyClick = () => {
        if (selectedMessage) {
            setReplyTo(selectedMessage);
            handleContextMenuClose();
        }
    };

    // Cancel reply
    const handleCancelReply = () => {
        setReplyTo(null);
    };

    // Handle emoji reaction from menu
    const handleEmojiMenuOpen = () => {
        handleContextMenuClose();
        if (selectedMessage) {
            setEmojiTargetMessage(selectedMessage);
            setEmojiPickerOpen(true);
        }
    };

    // Handle emoji selection
    const handleEmojiSelect = (e) => {
        if (emojiTargetMessage) {
            onReact(emojiTargetMessage.id, e.native);
            setEmojiPickerOpen(false);
            setEmojiTargetMessage(null);
        }
    };

    // Render reactions for a message
    const renderReactions = (reactions, messageId) => {
        if (!reactions || Object.keys(reactions).length === 0) return null;
    
        // Group reactions by emoji
        const reactionCounts = {};
        for (const emoji of Object.values(reactions)) { // Iterate through emoji values directly
            reactionCounts[emoji] = (reactionCounts[emoji] || 0) + 1;
        }
    
        return (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 0.5 }}>
                {Object.entries(reactionCounts).map(([emoji, count]) => (
                    <Chip
                        key={emoji}
                        label={`${emoji} ${count}`}
                        size="small"
                        sx={{
                            height: 24,
                            fontSize: '0.85rem',
                            bgcolor: 'action.selected',
                            borderRadius: '12px'
                        }}
                        onClick={() => onReact(messageId, emoji)} // Use messageId here
                    />
                ))}
            </Box>
        );
    };

    // Find user by ID
    const getUserById = (userId) => {
        return teamMembers.find(member => member.id === userId) || { username: 'Unknown User' };
    };

    // Format message timestamp
    const formatTimestamp = (timestamp) => {
        return dayjs(timestamp).fromNow();
    };

    return (
        <Box
            component="main"
            sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                height: '100%',
                bgcolor: 'background.paper',
                borderRadius: 1,
                overflow: 'hidden',
                border: isMultiWindow ? '1px solid rgba(0, 0, 0, 0.12)' : 'none'
            }}
        >
            {/* Channel header */}
            <AppBar
                position="static"
                color="inherit"
                elevation={0}
                sx={{ 
                    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                    backgroundColor: 'background.paper'
                }}
            >
                <Toolbar sx={{ minHeight: 64, justifyContent: 'space-between' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <IconButton
                            color="primary"
                            edge="start"
                            onClick={handleDrawerToggle}
                            sx={{ mr: 2, display: { md: 'none' } }}
                        >
                            <MenuIcon />
                        </IconButton>

                        {selectedChannel && (
                            <>
                                {selectedChannel.is_direct_message ? (
                                    <Avatar sx={{ 
                                        bgcolor: 'primary.light', 
                                        color: 'primary.contrastText',
                                        width: 38, 
                                        height: 38,
                                        mr: 2
                                    }}>
                                        <PersonIcon />
                                    </Avatar>
                                ) : (
                                    <Avatar sx={{ 
                                        bgcolor: 'secondary.light', 
                                        color: 'secondary.contrastText',
                                        width: 38, 
                                        height: 38,
                                        mr: 2
                                    }}>
                                        <TagIcon />
                                    </Avatar>
                                )}

                                <Box>
                                    <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600 }}>
                                    {selectedChannel.is_direct_message
            ? teamMembers.find(member => member.username !== username && selectedChannel.members.find(user => user.id === member.id))?.username || selectedChannel.name
            : selectedChannel.name}
                                    </Typography>
                                    <Typography variant="caption" color="text.secondary">
                                        {selectedChannel.is_direct_message ? 'Direct Message' : 'Channel'}
                                    </Typography>
                                </Box>
                            </>
                        )}
                    </Box>

                    {/* Close button for multi-window mode */}
                    {isMultiWindow && onClose && (
                        <IconButton 
                            onClick={onClose}
                            size="small"
                            color="inherit"
                            aria-label="close window"
                        >
                            <CloseIcon />
                        </IconButton>
                    )}
                </Toolbar>
            </AppBar>

            {/* Message container */}
            <Box
                ref={messageContainerRef}
                onScroll={handleScroll}
                sx={{
                    flex: 1,
                    overflowY: 'auto',
                    p: 2,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 0.2,
                    backgroundColor: 'background.default'
                }}
            >
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <CircularProgress />
                    </Box>
                ) : error ? (
                    <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>
                ) : messages.length === 0 ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                        <Typography color="text.secondary">
                            {selectedChannel ? 'No messages yet. Start the conversation!' : 'Select a channel to start chatting'}
                        </Typography>
                    </Box>
                ) : (
                    messages && messages.map((message, index) => {
                        const isOwnMessage = message.sender === username; // Compare with username
                        const showSender = index === 0 || messages[index - 1].sender !== message.sender;
                        const showReply = !!message.reply_to;

                        return (
                            <Box
                                key={message.id || index}
                                sx={{
                                    mb: 2,
                                    display: 'flex', // Use flexbox to align messages
                                    flexDirection: 'column',
                                    alignItems: isOwnMessage ? 'flex-end' : 'flex-start', // Align messages
                                }}
                            >
                                {showReply && (
                                    <Paper elevation={1} sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 1, mb: 1, maxWidth: "75%" }}>
                                        <Typography variant="caption" color="text.secondary">
                                            <ReplyIcon fontSize="small" sx={{ mr: 0.5 }} />
                                            {message.replied_message}
                                        </Typography>
                                    </Paper>
                                )}
                                {showSender && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.25, ml: isOwnMessage ? 0 : 1, mr: isOwnMessage ? 1 : 0 }}>
                                        {!isOwnMessage && (
                                            <Avatar sx={{ width: 24, height: 24, mr: 0.5, bgcolor: 'primary.light', fontSize: '0.75rem' }}>
                                                {message.sender?.charAt(0).toUpperCase()}
                                            </Avatar>
                                        )}
                                        <Typography
                                            variant="subtitle2"
                                            color="text.primary"
                                            sx={{
                                                display: 'block',
                                            }}
                                        >
                                            {message.sender}
                                        </Typography>
                                        {isOwnMessage && (
                                            <Avatar sx={{ width: 24, height: 24, ml: 0.5, bgcolor: 'primary.light', fontSize: '0.75rem' }}>
                                                {message.sender?.charAt(0).toUpperCase()}
                                            </Avatar>
                                        )}
                                    </Box>
                                )}

                                <Card
                                    elevation={2}
                                    sx={{
                                        backgroundColor: isOwnMessage ? 'blue.100' : 'grey.100', // Blue for own messages
                                        color: isOwnMessage ? 'black.100' : 'white.100',
                                        borderRadius: 1,
                                        maxWidth: '75%',
                                        wordBreak: 'break-word',
                                    }}
                                >
                                    <CardContent sx={{ py: 1, px: 2, '&:last-child': { pb: 1 } }}>
                                        <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                <Typography 
                                                    variant="body2" 
                                                    color='text.primary' 
                                                    sx={{
                                                        display: 'block',
                                                        mr: 1,
                                                        flex: 1
                                                    }}
                                                >
                                                    {message.content}
                                                </Typography>
                                                <Box sx={{ 
                                                    display: 'flex', 
                                                    alignItems: 'center',
                                                    flexShrink: 0
                                                }}>
                                                    <IconButton
                                                        aria-label="message options"
                                                        onClick={(event) => handleMessageOptionsClick(event, message)}
                                                        size="small"
                                                    >
                                                        <MoreVertIcon fontSize="small" />
                                                    </IconButton>
                                                </Box>
                                            </Box>
                                            <Typography variant="caption" color="text.secondary" sx={{ textAlign: isOwnMessage ? 'right' : 'left' }}>
                                                {formatTimestamp(message.timestamp)}
                                            </Typography>
                                        </Box>
                                        {renderReactions(message.reactions, message.id)}
                                    </CardContent>
                                </Card>
                            </Box>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </Box>

            {/* Message input area */}
            <Paper
                component="form"
                onSubmit={handleSendMessage}
                sx={{
                    p: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    borderTop: '1px solid rgba(0, 0, 0, 0.12)',
                    backgroundColor: 'background.default'
                }}
            >
                {replyTo && (
                    <Paper elevation={1} sx={{ p: 1, mr: 1, bgcolor: 'action.hover', borderRadius: 1 }}>
                        <Typography variant="caption" color="text.secondary">
                            Replying to {replyTo.sender}: {replyTo.content}
                            <IconButton size="small" onClick={handleCancelReply} sx={{ ml: 1 }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Typography>
                    </Paper>
                )}
                <TextField
                    fullWidth
                    placeholder="Send a message..."
                    variant="outlined"
                    size="small"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
                    inputRef={messageInputRef}
                    InputProps={{
                        endAdornment: (
                            <InputAdornment position="end">
                                <IconButton type="submit" color="primary" aria-label="send">
                                    <SendIcon />
                                </IconButton>
                            </InputAdornment>
                        ),
                    }}
                    sx={{ borderRadius: 2 }}
                />
            </Paper>

            {/* Context Menu */}
            <Menu
                id="message-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleContextMenuClose}
                MenuListProps={{
                    'aria-labelledby': 'basic-button',
                }}
            >
                <MenuItem onClick={handleReplyClick}>
                    <ListItemIcon>
                        <ReplyIcon fontSize="small" />
                    </ListItemIcon>
                    Reply
                </MenuItem>
                <MenuItem onClick={handleEmojiMenuOpen}>
                    <ListItemIcon>
                        <EmojiIcon fontSize="small" />
                    </ListItemIcon>
                    React with Emoji
                </MenuItem>
                {selectedMessage?.sender === username && (
                    <MenuItem onClick={handleDeleteMessage}>
                        <ListItemIcon>
                            <DeleteIcon fontSize="small" />
                        </ListItemIcon>
                        Delete
                    </MenuItem>
                )}
            </Menu>

            {/* Emoji Picker Modal */}
            <Modal
                open={emojiPickerOpen}
                onClose={() => setEmojiPickerOpen(false)}
                aria-labelledby="emoji-picker-modal"
                aria-describedby="emoji-picker-modal-description"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: 400,
                    bgcolor: 'background.paper',
                    border: '2px solid #000',
                    boxShadow: 24,
                    p: 4,
                }}>
                    <Picker data={data} onEmojiSelect={handleEmojiSelect} />
                </Box>
            </Modal>
        </Box>
    );
};

export default MessageWindow;
