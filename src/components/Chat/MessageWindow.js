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
    error
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
                overflow: 'hidden'
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
                <Toolbar sx={{ minHeight: 64 }}>
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
                                    {selectedChannel.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {selectedChannel.is_direct_message ? 'Direct Message' : 'Channel'}
                                </Typography>
                            </Box>
                        </>
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
                    messages.map((message, index) => {
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
                                                    variant="caption" 
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
                                                    
                                                    {/* More button inline with timestamp */}
                                                    <Tooltip title="More options">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(event) => handleMessageOptionsClick(event, message)}
                                                            sx={{ 
                                                                ml: 0.5, 
                                                                opacity: 0.6,
                                                                '&:hover': { opacity: 1 }
                                                            }}
                                                        >
                                                            <MoreHorizIcon fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            </Box>
                                            {renderReactions(message.reactions, message.id)}
                                        </Box>
                                    </CardContent>
                                </Card>
                            </Box>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </Box>

            {/* Message input area with reply preview above */}
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                {replyTo && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 1.5,
                            mx: 2,
                            mt: 1,
                            mb: 0,
                            bgcolor: 'action.hover',
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8,
                            borderBottomLeftRadius: 0,
                            borderBottomRightRadius: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            borderBottom: 'none',
                            borderLeft: '1px solid rgba(0, 0, 0, 0.12)',
                            borderRight: '1px solid rgba(0, 0, 0, 0.12)',
                            borderTop: '1px solid rgba(0, 0, 0, 0.12)'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <ReplyIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />
                            <Typography variant="body2" color="text.secondary" noWrap sx={{ maxWidth: '80%' }}>
                                <Typography component="span" fontWeight="medium" color="text.primary">
                                    {replyTo.sender}:
                                </Typography>{' '}
                                {replyTo.content}
                            </Typography>
                        </Box>
                        <IconButton size="small" onClick={handleCancelReply} edge="end">
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Paper>
                )}
                
                <Paper
                    component="form"
                    onSubmit={handleSendMessage}
                    sx={{
                        p: '8px 16px',
                        display: 'flex',
                        alignItems: 'center',
                        borderTop: replyTo ? 'none' : '1px solid rgba(0, 0, 0, 0.12)',
                        mx: replyTo ? 2 : 0,
                        borderTopLeftRadius: replyTo ? 0 : 4,
                        borderTopRightRadius: replyTo ? 0 : 4,
                        borderLeft: replyTo ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
                        borderRight: replyTo ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
                        borderBottom: replyTo ? '1px solid rgba(0, 0, 0, 0.12)' : 'none',
                        mb: replyTo ? 1 : 0
                    }}
                >
                    <TextField
                        inputRef={messageInputRef}
                        fullWidth
                        placeholder="Send a message..."
                        variant="outlined"
                        size="small"
                        value={messageText}
                        onChange={(e) => setMessageText(e.target.value)}
                        sx={{ flex: 1, mr: 1 }}
                        InputProps={{
                            endAdornment: (
                                <InputAdornment position="end">
                                    <IconButton onClick={(event) => {
                                        setEmojiTargetMessage(null);
                                        setEmojiPickerOpen(true);
                                    }}>
                                        <EmojiIcon />
                                    </IconButton>
                                </InputAdornment>
                            )
                        }}
                    />
                    <IconButton type="submit" color="primary" aria-label="send">
                        <SendIcon />
                    </IconButton>
                </Paper>
            </Box>
            
            {/* Dropdown Menu for Message Options */}
            <Menu
                id="message-options-menu"
                anchorEl={anchorEl}
                open={Boolean(anchorEl)}
                onClose={handleContextMenuClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
            >
                <MenuItem onClick={handleReplyClick}>
                    <ListItemIcon>
                        <ReplyIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Reply</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleEmojiMenuOpen}>
                    <ListItemIcon>
                        <EmojiIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Add reaction</ListItemText>
                </MenuItem>
                {selectedMessage && selectedMessage.sender === username && (
                    <MenuItem onClick={handleDeleteMessage}>
                        <ListItemIcon>
                            <DeleteIcon fontSize="small" />
                        </ListItemIcon>
                        <ListItemText>Delete</ListItemText>
                    </MenuItem>
                )}
            </Menu>
            
            {/* Emoji Picker Modal */}
            <Modal
                open={emojiPickerOpen}
                onClose={() => setEmojiPickerOpen(false)}
                aria-labelledby="emoji-picker"
                aria-describedby="emoji-picker-description"
            >
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        bgcolor: 'background.paper',
                        border: '2px solid #000',
                        boxShadow: 24,
                        p: 4,
                    }}
                >
                    <Picker data={data} onEmojiSelect={handleEmojiSelect} />
                </Box>
            </Modal>
        </Box>
    );
};

export default MessageWindow
