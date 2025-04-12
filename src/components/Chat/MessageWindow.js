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
    Checkbox,
    TextField,
    Fade,
    Backdrop
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
    PushPin as PinIcon,
    Edit as EditIcon
} from '@mui/icons-material';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import PresenceIndicator from './PresenceIndicator';

// Add dayjs plugins
dayjs.extend(relativeTime);

const MessageWindow = ({
    messages,
    selectedChannel,
    teamMembers,
    onSendMessage,
    forwardMessage,
    onDeleteMessage,
    onEditMessage,
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
    unpinMessage,
    userPresences
}) => {
    // State variables
    const [replyTo, setReplyTo] = useState(null);
    const [anchorEl, setAnchorEl] = useState(null);
    const [selectedMessage, setSelectedMessage] = useState(null);
    const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
    const [emojiTargetMessage, setEmojiTargetMessage] = useState(null);
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
    
    // Edit message states
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editMessageContent, setEditMessageContent] = useState('');

    //Search Functionality
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [currentSearchIndex, setCurrentSearchIndex] = useState(0);
    const [searchBarOpen, setSearchBarOpen] = useState(false);
    
    // Refs
    const messagesEndRef = useRef(null);
    const messageContainerRef = useRef(null);
    const editInputRef = useRef(null);

    // Forwarding states
    const [forwardModalOpen, setForwardModalOpen] = useState(false);
    const [messageToForward, setMessageToForward] = useState(null);

    // Edit Message
    const [editMessageId, setEditMessageId] = useState(null);

    // Get username from local storage
    const username = localStorage.getItem('username');

    const [alternateText, setAlternateText] = useState('Channel');
    const [lastSeen, setLastSeen] = useState(null);

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

    const searchMessages = (query) => {
        console.log("Search messages: ", query);
        
        if (!query.trim()) {
            setSearchResults([]);
            setCurrentSearchIndex(0);
            return;
        }
        
        const results = messages.filter(message => 
            message.content.toLowerCase().includes(query.toLowerCase())
        );
        
        setSearchResults(results);
        setCurrentSearchIndex(0);
        
        // Scroll to first result if available, with a slight delay to ensure state is updated
        if (results.length > 0) {
            // Use setTimeout to ensure the state update has completed
            setTimeout(() => {
                scrollToMessage(results[0].id);
            }, 100);
        }
    };

    const scrollToMessage = (messageId) => {
        // Allow a brief moment for the DOM to update
        setTimeout(() => {
            const messageElement = document.getElementById(`message-${messageId}`);
            if (messageElement) {
                // Scroll to the message with smooth behavior
                messageElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
                
                // Find the message card within the message bubble
                const messageCard = messageElement.querySelector('.MuiCard-root') || messageElement;
                
                // Store the original styles
                const originalBoxShadow = messageCard.style.boxShadow;
                
                // Apply highlight
                messageCard.style.boxShadow = '0 0 0 2px #FFC107';
                messageCard.style.transition = 'box-shadow 0.3s ease';
                
                // Remove highlight after delay
                setTimeout(() => {
                    messageCard.style.boxShadow = originalBoxShadow;
                }, 2000);
            } else {
                console.warn(`Message element with ID message-${messageId} not found`);
            }
        }, 100);
    };

    const goToNextSearchResult = () => {
        if (searchResults.length === 0) return;
        
        const nextIndex = (currentSearchIndex + 1) % searchResults.length;
        setCurrentSearchIndex(nextIndex);
        
        // Slight delay to ensure state update completes
        setTimeout(() => {
            scrollToMessage(searchResults[nextIndex].id);
        }, 50);
    };
    
    const goToPreviousSearchResult = () => {
        if (searchResults.length === 0) return;
        
        const prevIndex = (currentSearchIndex - 1 + searchResults.length) % searchResults.length;
        setCurrentSearchIndex(prevIndex);
        
        // Slight delay to ensure state update completes
        setTimeout(() => {
            scrollToMessage(searchResults[prevIndex].id);
        }, 50);
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

    // Handle edit message
    const handleEditClick = () => {
        if (selectedMessage) {
            setEditMessageContent(selectedMessage.content);
            setEditMessageId(selectedMessage.id);
            setEditModalOpen(true);
            handleContextMenuClose();
            
            // Focus the input after modal opens
            setTimeout(() => {
                if (editInputRef.current) {
                    editInputRef.current.focus();
                }
            }, 100);
        }
    };

    // Handle edit modal close
    const handleCloseEditModal = () => {
        setEditModalOpen(false);
        setEditMessageContent('');
    };

    // Submit edited message
    const handleSubmitEdit = () => {
        console.log("above : ", editMessageContent.trim())
        if (editMessageContent.trim() !== '') {
            console.log("gets here")
            onEditMessage(editMessageId, editMessageContent.trim());
            handleCloseEditModal();
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

    useEffect(() => {
        if (!selectedChannel.is_direct_message) {
          const interval = setInterval(() => {
            setAlternateText(prev =>
              prev === 'Channel'
                ? `${teamMembers.filter(member => 
                    selectedChannel.members.find(user => user.id === member.id) &&
                    userPresences[member.id]?.status === 'online'
                  ).length} online`
                : 'Channel'
            );
          }, 3000);
          return () => clearInterval(interval);
        }
      }, [selectedChannel, teamMembers, userPresences]);
    
      const getOnlineCount = () => {
        return teamMembers.filter(
          member =>
            selectedChannel.members.find(user => user.id === member.id) &&
            userPresences[member.id]?.status === 'online'
        ).length;
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
                borderRadius: 3,
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

                                <Box sx={{ display: 'flex', lineHeight: 1, flexDirection: 'column' }}>
                                    <Typography variant="h6" noWrap component="div" sx={{ fontWeight: 600, bottom:0 }}>
                                        {selectedChannel.is_direct_message
                                        ? (() => {
                                            const member = teamMembers.find(
                                                member =>
                                                member.username !== username &&
                                                selectedChannel.members.find(user => user.id === member.id)
                                            );
                                            return member?.username || selectedChannel.name;
                                            })()
                                        : selectedChannel.name}
                                        {selectedChannel.is_direct_message && (
                                        <PresenceIndicator
                                            status={(() => {
                                            const member = teamMembers.find(
                                                member =>
                                                member.username !== username &&
                                                selectedChannel.members.find(user => user.id === member.id)
                                            );
                                            return userPresences[member?.id]?.status || 'offline';
                                            })()}
                                            timestamp={(() => {
                                            const member = teamMembers.find(
                                                member =>
                                                member.username !== username &&
                                                selectedChannel.members.find(user => user.id === member.id)
                                            );
                                            return userPresences[member?.id]?.timestamp;
                                            })()}
                                            setLastseen={setLastSeen}
                                            size={8}
                                        />
                                        )}
                                    </Typography>

                                    <Typography variant="caption" color="text.secondary">
                                        {selectedChannel.is_direct_message ? lastSeen : alternateText}
                                    </Typography>
                                    </Box>
                            </>
                        )}
                    </Box>

                    <IconButton 
                        color="primary"
                        onClick={() => setSearchBarOpen(prev => !prev)}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M11 19C15.4183 19 19 15.4183 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </IconButton>

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

            {/* Search Bar */}
            {searchBarOpen && (
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    p: 1, 
                    borderBottom: '1px solid rgba(0, 0, 0, 0.08)',
                    backgroundColor: 'background.paper'
                }}>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => {
                            setSearchQuery(e.target.value);
                            searchMessages(e.target.value);
                        }}
                        placeholder="Search messages..."
                        style={{
                            flex: 1,
                            padding: '8px 12px',
                            border: '1px solid #ddd',
                            borderRadius: '4px',
                            marginRight: '8px'
                        }}
                        autoFocus
                    />
                    <Typography variant="body2" color="text.secondary" sx={{ mx: 1 }}>
                        {searchResults.length > 0 ? 
                            `${currentSearchIndex + 1}/${searchResults.length}` : 
                            'No results'}
                    </Typography>
                    <IconButton 
                        size="small" 
                        onClick={goToPreviousSearchResult}
                        disabled={searchResults.length === 0}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </IconButton>
                    <IconButton 
                        size="small" 
                        onClick={goToNextSearchResult}
                        disabled={searchResults.length === 0}
                    >
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <path d="M9 6L15 12L9 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                    </IconButton>
                    <IconButton 
                        size="small" 
                        onClick={() => {
                            setSearchBarOpen(false);
                            setSearchQuery('');
                            setSearchResults([]);
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </IconButton>
                </Box>
            )}

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
                            borderRadius: 2
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
                teamMembers={teamMembers}
                channelMembers={selectedChannel?.members}
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
                    React
                </MenuItem>
                <MenuItem onClick={handleCopyMessage}>
                    <ListItemIcon>
                        <CopyIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Copy</ListItemText>
                </MenuItem>
                <MenuItem onClick={handleForwardClick}>
                    <ListItemIcon>
                        <ForwardIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>Forward</ListItemText>
                </MenuItem>
                <MenuItem onClick={handlePinUnpinClick}>
                    <ListItemIcon>
                        <PinIcon fontSize="small" />
                    </ListItemIcon>
                    <ListItemText>
                        {selectedMessage?.is_pinned ? "Unpin" : "Pin"}
                    </ListItemText>
                </MenuItem>
                {selectedMessage?.sender === username && (
                    <>
                        <MenuItem onClick={handleEditClick}>
                            <ListItemIcon>
                                <EditIcon fontSize="small" />
                            </ListItemIcon>
                            <ListItemText>Edit</ListItemText>
                        </MenuItem>
                        <MenuItem onClick={handleDeleteMessage}>
                            <ListItemIcon>
                                <DeleteIcon fontSize="small" />
                            </ListItemIcon>
                            Delete
                        </MenuItem>
                    </>
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

            {/* Edit Message Modal */}
            <Modal
                open={editModalOpen}
                onClose={handleCloseEditModal}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                }}
                aria-labelledby="edit-message-modal"
                aria-describedby="edit-your-message"
            >
                <Fade in={editModalOpen}>
                    <Paper
                        elevation={24}
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '90%',
                            maxWidth: 500,
                            bgcolor: 'background.paper',
                            borderRadius: 2,
                            boxShadow: theme => theme.shadows[24],
                            p: 4,
                            outline: 'none',
                        }}
                    >
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                            <Typography id="edit-message-modal" variant="h5" component="h2" fontWeight="bold">
                                Edit Message
                            </Typography>
                            <IconButton onClick={handleCloseEditModal} size="small">
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Box>
                        
                        <TextField
                            id="edit-message-content"
                            inputRef={editInputRef}
                            fullWidth
                            multiline
                            minRows={3}
                            maxRows={8}
                            variant="outlined"
                            value={editMessageContent}
                            onChange={(e) => setEditMessageContent(e.target.value)}
                            placeholder="Edit your message..."
                            autoFocus
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    borderRadius: 2,
                                    backgroundColor: 'rgba(0, 0, 0, 0.01)',
                                    '&:hover fieldset': {
                                        borderColor: 'primary.main',
                                    },
                                    '&.Mui-focused fieldset': {
                                        borderColor: 'primary.main',
                                        borderWidth: '2px',
                                    },
                                },
                                mb: 3
                            }}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault();
                                    handleSubmitEdit();
                                }
                            }}
                        />
                        
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                            <Button 
                                variant="outlined" 
                                onClick={handleCloseEditModal}
                                sx={{ borderRadius: 6 }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                variant="contained" 
                                color="primary" 
                                onClick={handleSubmitEdit}
                                disabled={!editMessageContent.trim()}
                                sx={{ 
                                    borderRadius: 6,
                                    px: 3,
                                    boxShadow: 2,
                                    '&:hover': {
                                        boxShadow: 4,
                                    }
                                }}
                            >
                                Save Changes
                            </Button>
                        </Box>
                    </Paper>
                </Fade>
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