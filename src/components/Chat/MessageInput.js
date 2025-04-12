import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    Box,
    TextField,
    IconButton,
    Paper,
    InputAdornment,
    Typography,
    Tooltip,
    Modal,
    Tabs,
    Tab,
    Grid,
    InputBase,
    CircularProgress,
    List,
    ListItem,
    ListItemText,
    ListItemIcon,
    Button,
    MenuItem,
    Avatar,
    Menu
} from '@mui/material';
import {
    EmojiEmotions as EmojiIcon,
    Gif as GifIcon,
    Send as SendIcon,
    Close as CloseIcon,
    Search as SearchIcon,
    AttachFile as AttachFileIcon,
    InsertDriveFile as FileIcon,
    Download as DownloadIcon,
    UploadFile as UploadIcon
} from '@mui/icons-material';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';
import { LinkPreview } from '@dhaiwat10/react-link-preview';
import axios from 'axios';

const TENOR_API_KEY = process.env.REACT_APP_TENOR_API_KEY; // Replace with your actual Tenor API key

const MessageInput = ({
    onSendMessage,
    replyTo,
    handleCancelReply,
    setReplyTo,
    teamMembers, 
    channelMembers
}) => {
    // State variables
    const [messageText, setMessageText] = useState("");
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showGifPicker, setShowGifPicker] = useState(false);
    const [mediaPickerTab, setMediaPickerTab] = useState(0);
    const [gifSearchQuery, setGifSearchQuery] = useState('');
    const [gifs, setGifs] = useState([]);
    const [isLoadingGifs, setIsLoadingGifs] = useState(false);
    const [selectedGif, setSelectedGif] = useState(null);

    //Mentions
    const [mentionAnchorEl, setMentionAnchorEl] = useState(null);
    const [mentionQuery, setMentionQuery] = useState('');
    const [mentionStart, setMentionStart] = useState(null);
    const [filteredMentions, setFilteredMentions] = useState([]);

    // File attachment states
    const [attachedFiles, setAttachedFiles] = useState([]);
    const [isUploadingFile, setIsUploadingFile] = useState(false);
    
    // Refs
    const messageInputRef = useRef(null);
    const fileInputRef = useRef(null);
    const gifSearchTimeoutRef = useRef(null);

    //Link Previews
    const [links, setLinks] = useState([]);
    const [linkPreview, setLinkPreview] = useState(null);
    const [isLoadingPreview, setIsLoadingPreview] = useState(false);

    // Focus input when reply is set
    useEffect(() => {
        if (replyTo && messageInputRef.current) {
            messageInputRef.current.focus();
        }
    }, [replyTo]);

    useEffect(() => {
        if (messageText && messageText.endsWith('@')) {
            handleMentionTrigger();
        }
    }, [messageText])

    const handleMentionTrigger = () => {
        if (!messageInputRef.current) return;
        
        setMentionStart(messageText.length);
        setMentionQuery('');
        setMentionAnchorEl(messageInputRef.current);
        
        // Initialize with all available members
        const allMembers = [
            { id: 'everyone', username: 'everyone', displayName: 'Everyone' },
            ...(channelMembers || teamMembers || [])
        ];
        
        setFilteredMentions(allMembers);
    };
    
    const handleMentionSelect = (member) => {
        if (!member) return;
        
        // Insert the mention into the text
        const beforeMention = messageText.substring(0, mentionStart);
        const mention = `@${member.username} `;
        
        setMessageText(beforeMention + mention);
        setMentionAnchorEl(null);
        
        // Focus the input after selecting a mention
        if (messageInputRef.current) {
            messageInputRef.current.focus();
        }
    };
    
    const handleMessageInputKeyDown = (e) => {
        // Check for @ symbol to trigger mentions
        if (e.key === '@') {
            handleMentionTrigger();
        }
        
        // Close mention dropdown when Escape is pressed
        if (e.key === 'Escape' && mentionAnchorEl) {
            setMentionAnchorEl(null);
        }
    };
    
    const handleMentionQueryChange = (e) => {
        const query = e.target.value.substring(mentionStart);
        setMentionQuery(query);
        
        // Filter members based on the query
        const allMembers = [
            { id: 'everyone', username: 'everyone', displayName: 'Everyone' },
            ...(channelMembers || teamMembers || [])
        ];
        
        const filtered = query
            ? allMembers.filter(member => 
                member.username.toLowerCase().includes(query.toLowerCase()) ||
                (member.displayName && member.displayName.toLowerCase().includes(query.toLowerCase()))
            )
            : allMembers;
            
        setFilteredMentions(filtered);
    };

    const detectLinks = useCallback((text) => {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    }, []);

    useEffect(() => {
        const detectedLinks = detectLinks(messageText);
        setLinks(detectedLinks);
        
        // If links are found, fetch preview for the first one
        if (detectedLinks.length > 0 && !linkPreview) {
            fetchLinkPreview(detectedLinks[0]);
        }
        
        // If message is cleared or links removed, clear preview
        if (detectedLinks.length === 0 && linkPreview) {
            setLinkPreview(null);
        }
    }, [messageText, detectLinks]);

    const fetchLinkPreview = async (url) => {
        try {
            setIsLoadingPreview(true);
            const response = await axios.post('http://localhost:8000/api/chat/fetch-link-preview/', { url }, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`
                }
            });
            setLinkPreview(response.data);
        } catch (error) {
            console.error('Error fetching link preview:', error);
        } finally {
            setIsLoadingPreview(false);
        }
    };

    // Handle tab change in media picker
    const handleMediaPickerTabChange = (event, newValue) => {
        setMediaPickerTab(newValue);
        // Load GIFs when switching to GIF tab
        if (newValue === 1 && gifs.length === 0) {
            fetchTrendingGifs();
        }
    };

    // Toggle emoji picker
    const toggleEmojiPicker = () => {
        setShowEmojiPicker(!showEmojiPicker);
        setShowGifPicker(false);
    };

    // Toggle GIF picker
    const toggleGifPicker = () => {
        setShowGifPicker(!showGifPicker);
        setShowEmojiPicker(false);
        if (!showGifPicker && gifs.length === 0) {
            fetchTrendingGifs();
        }
    };

    // Handle emoji selection
    const handleEmojiSelect = (emoji) => {
        setMessageText(prev => prev + emoji.native);
        if (messageInputRef.current) {
            messageInputRef.current.focus();
        }
    };

    // File attachment handling
    const handleFileButtonClick = () => {
        fileInputRef.current.click();
    };

    const handleFileChange = async (event) => {
        const files = event.target.files;
        if (!files || files.length === 0) return;
        
        setIsUploadingFile(true);
        
        try {
            const filePromises = Array.from(files).map(async (file) => {
                const formData = new FormData();
                formData.append('file', file);
                
                const response = await axios.post('http://localhost:8000/api/chat/upload-file/', formData, {
                    headers: {
                        'Content-Type': 'multipart/form-data',
                        'Authorization': `Bearer ${localStorage.getItem('token')}`
                    }
                });
                
                return {
                    id: response.data.id,
                    filename: response.data.filename,
                    url: response.data.url,
                    size: response.data.size,
                    content_type: response.data.content_type
                };
            });
            
            const uploadedFiles = await Promise.all(filePromises);
            setAttachedFiles(prev => [...prev, ...uploadedFiles]);
        } catch (error) {
            console.error('Error uploading file:', error);
            alert('Failed to upload file. Please try again.');
        } finally {
            setIsUploadingFile(false);
            // Clear the file input so the same file can be selected again
            event.target.value = '';
        }
    };

    const removeAttachedFile = (fileId) => {
        setAttachedFiles(prev => prev.filter(file => file.id !== fileId));
    };

    // Fetch trending GIFs (mock implementation)
    const fetchTrendingGifs = async () => {
        try {
            console.log("API KEY : ", TENOR_API_KEY)
            setIsLoadingGifs(true);
            // Using v2 API endpoint
            const response = await fetch(
                `${process.env.REACT_APP_TENOR_BASE_URL}/featured?key=${TENOR_API_KEY}&limit=20`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const data = await response.json();
            console.log("Tenor API response:", data); // Debug response
            
            // Update this to match v2 API response format
            if (data.results) {
                setGifs(data.results.map(gif => ({
                    id: gif.id,
                    url: gif.media_formats.gif.url,
                    preview: gif.media_formats.tinygif.url, // Use tinygif for preview
                    title: gif.title || 'GIF'
                })));
            } else {
                console.error("Unexpected API response format:", data);
            }
        } catch (error) {
            console.error('Error fetching trending GIFs:', error);
        } finally {
            setIsLoadingGifs(false);
        }
    };

    // Handle GIF search
    const handleGifSearch = (e) => {
        const query = e.target.value;
        setGifSearchQuery(query);
        
        // Debounce search to avoid too many requests
        if (gifSearchTimeoutRef.current) {
            clearTimeout(gifSearchTimeoutRef.current);
        }
        
        if (query.trim().length > 2) {
            gifSearchTimeoutRef.current = setTimeout(() => {
                searchGifs(query);
            }, 500);
        } else if (query.trim().length === 0) {
            fetchTrendingGifs();
        }
    };

    const searchGifs = async (query) => {
        try {
            setIsLoadingGifs(true);
            const response = await fetch(
                `${process.env.REACT_APP_TENOR_BASE_URL}/search?q=${encodeURIComponent(query)}&key=${TENOR_API_KEY}&limit=20`,
                {
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }
            );
            
            const data = await response.json();
            console.log("Search results:", data); // Debug response
            
            if (data.results) {
                setGifs(data.results.map(gif => ({
                    id: gif.id,
                    url: gif.media_formats.gif.url,
                    preview: gif.media_formats.tinygif.url,
                    title: gif.title || 'GIF'
                })));
            } else {
                console.error("Unexpected API response format:", data);
            }
        } catch (error) {
            console.error('Error searching GIFs:', error);
        } finally {
            setIsLoadingGifs(false);
        }
    };

    // Handle GIF selection
    const handleGifSelect = (gif) => {
        setSelectedGif(gif);
        setShowGifPicker(false);
    };

    // Send message with attachments
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (messageText.trim() || selectedGif || linkPreview || attachedFiles.length > 0) {
            const messageContent = selectedGif 
                ? `${messageText.trim()} [GIF:${selectedGif.url}]` 
                : messageText;
            
            // Get file IDs for the message
            const fileIds = attachedFiles.map(file => file.id);
                
            // Include link preview data and file IDs
            onSendMessage(messageContent, replyTo?.id, linkPreview, fileIds);
            
            // Reset everything
            setMessageText('');
            setReplyTo(null);
            setSelectedGif(null);
            setLinkPreview(null);
            setAttachedFiles([]);
            setShowEmojiPicker(false);
            setShowGifPicker(false);
        }
    };

    return (
        <Box sx={{ position: 'relative' }}>
            {/* Emoji and GIF picker */}
            {(showEmojiPicker || showGifPicker) && (
                <Paper 
                    elevation={3}
                    sx={{
                        position: 'absolute',
                        bottom: '100%',
                        left: 16,
                        width: 'calc(100% - 32px)',
                        maxHeight: 350,
                        borderRadius: 3,
                        overflow: 'hidden',
                        mb: 1,
                        zIndex: 100
                    }}
                >
                    <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                        <Tabs value={mediaPickerTab} onChange={handleMediaPickerTabChange} aria-label="media picker tabs">
                            <Tab icon={<EmojiIcon />} />
                            <Tab icon={<GifIcon />} />
                        </Tabs>
                    </Box>
                    
                    {mediaPickerTab === 0 && (
                        <Box sx={{ height: 300, overflow: 'auto' }}>
                            <Picker 
                                data={data} 
                                onEmojiSelect={handleEmojiSelect} 
                                theme="light" 
                                perLine={28}
                            />
                        </Box>
                    )}
                    
                    {mediaPickerTab === 1 && (
                        <Box sx={{ height: 300, overflow: 'auto', p: 2 }}>
                            {/* GIF search */}
                            {gifs.length === 0 && !isLoadingGifs && (
                                <Typography color="error" variant="body2" sx={{ mb: 2 }}>
                                    No GIFs loaded. Check console for errors.
                                </Typography>
                            )}
                            <Paper 
                                sx={{ 
                                    p: '2px 4px', 
                                    display: 'flex', 
                                    alignItems: 'center', 
                                    mb: 2,
                                    borderRadius: 20
                                }}
                            >
                                <InputBase
                                    sx={{ ml: 1, flex: 1 }}
                                    placeholder="Search GIFs"
                                    value={gifSearchQuery}
                                    onChange={handleGifSearch}
                                />
                                <IconButton type="button" sx={{ p: '10px' }} aria-label="search">
                                    <SearchIcon />
                                </IconButton>
                            </Paper>
                            
                            {isLoadingGifs ? (
                                <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                                    <CircularProgress size={28} />
                                </Box>
                            ) : (
                                <Grid container spacing={1}>
                                    {gifs.map(gif => (
                                        <Grid item xs={2} sm={2} key={gif.id}>
                                            <Box 
                                                component="img" 
                                                src={gif.preview} 
                                                alt={gif.title}
                                                onClick={() => handleGifSelect(gif)}
                                                sx={{
                                                    width: '100%',
                                                    height: 100,
                                                    objectFit: 'cover',
                                                    borderRadius: 1,
                                                    cursor: 'pointer',
                                                    transition: 'transform 0.2s',
                                                    '&:hover': {
                                                        transform: 'scale(1.05)',
                                                        boxShadow: 3
                                                    }
                                                }}
                                            />
                                        </Grid>
                                    ))}
                                </Grid>
                            )}
                            
                            <Typography 
                                variant="caption" 
                                color="text.secondary" 
                                sx={{ 
                                    display: 'block', 
                                    textAlign: 'center', 
                                    mt: 2 
                                }}
                            >
                                Powered by Tenor
                            </Typography>
                        </Box>
                    )}
                </Paper>
            )}
            
            {/* Selected GIF preview */}
            {selectedGif && (
                <Box 
                    sx={{ 
                        p: 1, 
                        borderTop: '1px solid rgba(0, 0, 0, 0.12)', 
                        backgroundColor: 'background.paper',
                        position: 'relative'
                    }}
                >
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            p: 1,
                            borderRadius: 1,
                            backgroundColor: 'action.hover'
                        }}
                    >
                        <Box 
                            component="img" 
                            src={selectedGif.preview} 
                            alt="Selected GIF"
                            sx={{
                                height: 60,
                                borderRadius: 1,
                                mr: 1
                            }}
                        />
                        <Typography variant="caption" sx={{ flex: 1 }}>GIF selected</Typography>
                        <IconButton 
                            size="small" 
                            onClick={() => setSelectedGif(null)}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            )}

            {/* File Attachments */}
            {attachedFiles.length > 0 && (
                <Box 
                    sx={{ 
                        p: 1, 
                        borderTop: '1px solid rgba(0, 0, 0, 0.12)', 
                        backgroundColor: 'background.paper',
                        position: 'relative'
                    }}
                >
                    <List dense>
                        {attachedFiles.map((file) => (
                            <ListItem
                                key={file.id}
                                secondaryAction={
                                    <IconButton edge="end" aria-label="delete" onClick={() => removeAttachedFile(file.id)}>
                                        <CloseIcon />
                                    </IconButton>
                                }
                                sx={{
                                    borderRadius: 1,
                                    mb: 0.5,
                                    backgroundColor: 'action.hover'
                                }}
                            >
                                <ListItemIcon>
                                    <FileIcon />
                                </ListItemIcon>
                                <ListItemText 
                                    primary={file.filename} 
                                    secondary={`${(file.size / 1024).toFixed(2)} KB`} 
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>
            )}

            {/* Link Preview */}
            {linkPreview && (
                <Box 
                    sx={{ 
                        p: 1, 
                        borderTop: '1px solid rgba(0, 0, 0, 0.12)', 
                        backgroundColor: 'background.paper',
                        position: 'relative'
                    }}
                >
                    <Box 
                        sx={{ 
                            display: 'flex', 
                            alignItems: 'center',
                            p: 1,
                            borderRadius: 1,
                            backgroundColor: 'action.hover'
                        }}
                    >
                        {linkPreview.image && (
                            <Box 
                                component="img" 
                                src={linkPreview.image} 
                                alt="Link preview"
                                sx={{
                                    height: 60,
                                    width: 60,
                                    objectFit: 'cover',
                                    borderRadius: 1,
                                    mr: 1
                                }}
                            />
                        )}
                        <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                                {linkPreview.title || 'Untitled'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                {linkPreview.description?.substring(0, 100) || 'No description'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                {new URL(linkPreview.url).hostname}
                            </Typography>
                        </Box>
                        <IconButton 
                            size="small" 
                            onClick={() => setLinkPreview(null)}
                        >
                            <CloseIcon fontSize="small" />
                        </IconButton>
                    </Box>
                </Box>
            )}
            
            {/* Message form */}
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
                            Replying to {replyTo.sender}: {replyTo.content.length > 30 ? `${replyTo.content.substring(0, 30)}...` : replyTo.content}
                            <IconButton size="small" onClick={handleCancelReply} sx={{ ml: 1 }}>
                                <CloseIcon fontSize="small" />
                            </IconButton>
                        </Typography>
                    </Paper>
                )}
                
                {/* Hidden file input */}
                <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                    multiple
                />
                
                <TextField
                    fullWidth
                    placeholder="Send a message..."
                    variant="outlined"
                    size="small"
                    value={messageText}
                    onChange={(e) => {
                        setMessageText(e.target.value)
                        if (mentionAnchorEl) {
                            handleMentionQueryChange(e);
                        }
                    }}
                    onKeyDown={handleMessageInputKeyDown}
                    inputRef={messageInputRef}
                    InputProps={{
                        startAdornment: (
                            <InputAdornment position="start">
                                <Tooltip title="Add emoji">
                                    <IconButton 
                                        color={showEmojiPicker ? "primary" : "default"} 
                                        aria-label="emoji" 
                                        onClick={toggleEmojiPicker}
                                    >
                                        <EmojiIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Add GIF">
                                    <IconButton 
                                        color={showGifPicker ? "primary" : "default"} 
                                        aria-label="gif" 
                                        onClick={toggleGifPicker}
                                    >
                                        <GifIcon />
                                    </IconButton>
                                </Tooltip>
                                <Tooltip title="Attach file">
                                    <IconButton 
                                        aria-label="attach file" 
                                        onClick={handleFileButtonClick}
                                        disabled={isUploadingFile}
                                    >
                                        {isUploadingFile ? (
                                            <CircularProgress size={24} />
                                        ) : (
                                            <AttachFileIcon />
                                        )}
                                    </IconButton>
                                </Tooltip>
                            </InputAdornment>
                        ),
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

                <Menu
                    anchorEl={mentionAnchorEl}
                    open={Boolean(mentionAnchorEl)}
                    onClose={() => setMentionAnchorEl(null)}
                    sx ={{
                        maxHeight: 300,
                        width: 250
                    }}
                >
                    {filteredMentions.map((member) => (
                        <MenuItem
                            key={member.id || member.username}
                            onClick={() => handleMentionSelect(member)}
                        >
                            <ListItemIcon>
                                <Avatar sx={{ width: 24, height: 24}}>
                                    {member.username.substring(0, 1).toUpperCase()}
                                </Avatar>
                            </ListItemIcon>
                            <ListItemText>
                                {member.username}
                                {member.username === 'everyone' && '(notify all)'}
                            </ListItemText>
                        </MenuItem>
                    ))}
                    {filteredMentions.length === 0 && (
                        <MenuItem disabled>
                            <ListItemText>No Matches found</ListItemText>
                        </MenuItem>
                    )}

                </Menu>
            </Paper>
        </Box>
    );
};

export default MessageInput;