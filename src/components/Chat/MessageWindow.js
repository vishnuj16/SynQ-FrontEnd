import React, { useState, useRef, useEffect } from 'react';
import {
    Button, 
    Box,
    Typography,
    IconButton,
    Paper,
    Toolbar,
    AppBar,
    Avatar,
    Menu,
    Modal,
    MenuItem,
    CircularProgress,
    Alert,
    List,
    ListItemIcon,
    ListItem,
    ListItemText,
    Checkbox
} from '@mui/material';
import {
    Delete as DeleteIcon,
    MoreVert as MoreVertIcon,
    Reply as ReplyIcon,
    Tag as TagIcon,
    Person as PersonIcon,
    Menu as MenuIcon,
    EmojiEmotions as EmojiIcon,
    Close as CloseIcon,
    ContentCopy as CopyIcon,
    Forward as ForwardIcon,
    PushPin as PinIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';

// Add dayjs plugins
dayjs.extend(relativeTime);

const MessageWindow = ({
    messages,
    selectedChannel,
    teamMembers,
    onSendMessage,
    forwardMessage,
    onDeleteMessage,
    onReact,
    handleDrawerToggle,
    loading,
    error,
    onClose,
    isMultiWindow,
    channels,
    setSelectedChannelsForForward,
    selectedChannelsForForward,
    pinMessage,
    unpinMessage
}) => {
    // State variables
    const [replyTo, setReplyTo] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [emojiTargetMessage, setEmojiTargetMessage] = useState(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    
    // Refs
    const messagesEndRef = useRef(null);
    const messageContainerRef = useRef(null);

    // Forwarding states
    const [forwardModalOpen, setForwardModalOpen] = useState(false);
    const [messageToForward, setMessageToForward] = useState(null);

    // Get username from local storage
    const username = localStorage.getItem('username');

    const pinnedMessage = messages.find((message) => message.is_pinned);

    // Scroll to bottom when messages change
    useEffect(() => {
        if (messagesEndRef.current && shouldAutoScroll) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages, shouldAutoScroll]);

    const handleScroll = () => {
        if (messageContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = messageContainerRef.current;
            const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
            setShouldAutoScroll(isNearBottom);
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

    // Handle emoji selection for reactions
    const handleEmojiSelect = (e) => {
        if (emojiTargetMessage) {
            onReact(emojiTargetMessage.id, e.native);
            setEmojiPickerOpen(false);
            setEmojiTargetMessage(null);
        }
    };

    const handleCopyMessage = () => {
        if (selectedMessage) {
            navigator.clipboard.writeText(selectedMessage.content)
                .then(() => {
                    console.log('Message copied to clipboard');
                    handleContextMenuClose();
                })
                .catch(err => {
                    console.error('Failed to copy message: ', err);
                });
        }
    };

    // Open forward modal
    const handleForwardClick = () => {
        if (selectedMessage) {
            setMessageToForward(selectedMessage);
            setForwardModalOpen(true);
            handleContextMenuClose();
        }
    };

    // Close forward modal
    const handleCloseForwardModal = () => {
        setForwardModalOpen(false);
        setSelectedChannelsForForward([]);
        setMessageToForward(null);
    };

    // Toggle channel selection for forwards
    const handleChannelSelectForForward = (channelId) => {
        setSelectedChannelsForForward(prev => {
            if (prev.includes(channelId)) {
                return prev.filter(id => id !== channelId);
            } else {
                return [...prev, channelId];
            }
        });
    };

    const handlePinUnpinClick = () => {
        if (selectedMessage) {
            if (selectedMessage.is_pinned) {
                unpinMessage(selectedMessage.id);
            } else {
                pinMessage(selectedMessage.id);
            }
            handleContextMenuClose();
        }
    }

    // Forward the message to selected channels
    const handleForwardMessage = () => {
        console.log("Handle forward message : ", messageToForward)
        if (messageToForward) {
            forwardMessage(messageToForward.content);
            handleCloseForwardModal();
            setMessageToForward(null);
        }
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
                {pinnedMessage && (
                    <Paper
                        elevation={4}
                        sx={{
                            p: 0.5,
                            backgroundColor: '#ffefc1',
                            borderLeft: '4px solid #ff9800',
                            position: 'sticky',
                            top: 0,
                            zIndex: 9,
                        }}
                    >
                        <Typography
                            variant="body1"
                            sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}
                        >
                            📌 Pinned Message
                            <IconButton
                                size="small"
                                sx={{ color: 'text.secondary' }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    unpinMessage(pinnedMessage.id);
                                }}
                            >
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Typography>
                        <Typography variant="body2">
                            {pinnedMessage.content}
                        </Typography>
                        <Typography
                            variant="caption"
                            sx={{ display: 'block', mt: 1, color: 'gray' }}
                        >
                            {dayjs(pinnedMessage.timestamp).fromNow()}
                        </Typography>
                    </Paper>
                )}
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
                        const isOwnMessage = message.sender === username;
                        const showSender = index === 0 || messages[index - 1].sender !== message.sender;
                        const showReply = !!message.reply_to;
                        const showIfForwarded = message.is_forwarded;

                        return (
                            <MessageBubble
                                key={message.id || index}
                                message={message}
                                isOwnMessage={isOwnMessage}
                                showSender={showSender}
                                showReply={showReply}
                                showIfForwarded={showIfForwarded}
                                formatTimestamp={formatTimestamp}
                                handleMessageOptionsClick={handleMessageOptionsClick}
                                onReact={onReact}
                            />
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </Box>

            <MessageInput
                messageText=""
                setMessageText={() => {}}
                replyTo={replyTo}
                onSendMessage={onSendMessage}
                handleCancelReply={handleCancelReply}
                setReplyTo={setReplyTo}
            />

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
                <MenuItem onClick={handleCopyMessage}>
                    <ListItemIcon>
                        <CopyIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Copy Message</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleForwardClick}>
                    <ListItemIcon>
                        <ForwardIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Forward Message</ListItemText>
                </MenuItem>
                <MenuItem onClick={handlePinUnpinClick}>
                    <ListItemIcon>
                        <PinIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                        {selectedMessage?.is_pinned ? "Unpin Message" : "Pin Message"}
                    </ListItemText>
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

            {/* Forward Message Modal */}
            <Modal
                open={forwardModalOpen}
                onClose={handleCloseForwardModal}
                aria-labelledby="forward-message-modal"
                aria-describedby="select-channels-to-forward-message"
            >
                <Box sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    width: '90%',
                    maxWidth: 500,
                    bgcolor: 'background.paper',
                    border: '2px solid #000',
                    boxShadow: 24,
                    p: 4,
                    borderRadius: 2,
                }}>
                    <Typography id="forward-message-modal" variant="h6" component="h2">
                        Select Channels to Forward Message
                    </Typography>
                    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
                        {channels.map((channel) => (
                            <ListItem key={channel.id} onClick={() => handleChannelSelectForForward(channel.id)}>
                                <ListItemIcon>
                                    <Checkbox
                                        edge="start"
                                        checked={selectedChannelsForForward.includes(channel.id)}
                                        tabIndex={-1}
                                        disableRipple
                                    />
                                </ListItemIcon>
                                <ListItemText primary={channel.name} />
                            </ListItem>
                        ))}
                    </List>
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                        <Button onClick={handleCloseForwardModal} sx={{ mr: 1 }}>
                            Cancel
                        </Button>
                        <Button variant="contained" color="primary" onClick={handleForwardMessage}>
                            Forward
                        </Button>
                    </Box>
                </Box>
            </Modal>
        </Box>
    );
};

export default MessageWindow;