import React, { useState, useRef, useEffect } from 'react';
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
    CircularProgress
} from '@mui/material';
import {
    EmojiEmotions as EmojiIcon,
    Gif as GifIcon,
    Send as SendIcon,
    Close as CloseIcon,
    Search as SearchIcon
} from '@mui/icons-material';
import data from '@emoji-mart/data';
import Picker from '@emoji-mart/react';

const TENOR_API_KEY = process.env.REACT_APP_TENOR_API_KEY; // Replace with your actual Tenor API key

const MessageInput = ({
    onSendMessage,
    replyTo,
    handleCancelReply,
    setReplyTo
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

    // Refs
    const messageInputRef = useRef(null);
    const gifSearchTimeoutRef = useRef(null);

    // Focus input when reply is set
    useEffect(() => {
        if (replyTo && messageInputRef.current) {
            messageInputRef.current.focus();
        }
    }, [replyTo]);

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

    // Fetch trending GIFs (mock implementation)
    const fetchTrendingGifs = async () => {
        try {
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

    // Send message
    const handleSendMessage = (e) => {
        e.preventDefault();
        if (messageText.trim() || selectedGif) {
            const messageContent = selectedGif 
                ? `${messageText.trim()} [GIF:${selectedGif.url}]` // Adding GIF URL to message content
                : messageText;
                
            onSendMessage(messageContent, replyTo?.id);
            setMessageText('');
            setReplyTo(null);
            setSelectedGif(null);
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
                        borderRadius: 2,
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
                
                <TextField
                    fullWidth
                    placeholder="Send a message..."
                    variant="outlined"
                    size="small"
                    value={messageText}
                    onChange={(e) => setMessageText(e.target.value)}
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
            </Paper>
        </Box>
    );
};

export default MessageInput;