import React from 'react';
import {
    Box,
    Typography,
    IconButton,
    Paper,
    Avatar,
    Card,
    CardContent,
    Chip
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Reply as ReplyIcon,
    Forward as ForwardIcon
} from '@mui/icons-material';

const MessageBubble = ({
    message,
    isOwnMessage,
    showSender,
    showReply,
    showIfForwarded,
    formatTimestamp,
    handleMessageOptionsClick,
    onReact
}) => {
    // Parse message content for GIFs
    const parseMessageContent = (content) => {
        const gifRegex = /\[GIF:(.*?)\]/;
        const match = content.match(gifRegex);
        
        if (match) {
            const gifUrl = match[1];
            const textContent = content.replace(gifRegex, '').trim();
            
            return (
                <>
                    {textContent && <Typography variant="body2" color="text.primary" sx={{ mb: 1 }}>{textContent}</Typography>}
                    <Box sx={{ maxWidth: '100%', borderRadius: 1, overflow: 'hidden' }}>
                        <img src={gifUrl} alt="GIF" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                    </Box>
                </>
            );
        }
        
        return content;
    };

    // Render reactions for a message
    const renderReactions = (reactions, messageId) => {
        if (!reactions || Object.keys(reactions).length === 0) return null;
    
        // Group reactions by emoji
        const reactionCounts = {};
        for (const emoji of Object.values(reactions)) {
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
                        onClick={() => onReact(messageId, emoji)}
                    />
                ))}
            </Box>
        );
    };

    return (
        <Box
            sx={{
                mb: 2,
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
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
            {showIfForwarded && (
                <Paper elevation={1} sx={{ p: 1, bgcolor: 'action.hover', borderRadius: 3   , mb: 1, maxWidth: "75%" }}>
                    <Typography variant="caption" color="text.secondary">
                        <ForwardIcon fontSize="small" sx={{ mr: 0.5 }} />
                        Forwarded...
                    </Typography>
                </Paper>
            )}

            <Card
                elevation={2}
                sx={{
                    backgroundColor: isOwnMessage ? 'blue.100' : 'black.100',
                    color: isOwnMessage ? 'black.100' : 'white.100',
                    borderRadius: 3, // Increased for a more circular appearance
                    maxWidth: '70%', // Slightly reduced size
                    wordBreak: 'break-word',
                }}
            >
                <CardContent
                    sx={{
                        py: 0.75, // Reduced padding
                        px: 1.5, // Reduced padding
                        '&:last-child': { pb: 0.75 },
                    }}
                >
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <Box
                                sx={{
                                    display: 'block',
                                    mr: 1,
                                    flex: 1,
                                }}
                            >
                                {parseMessageContent(message.content)}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                <IconButton
                                    aria-label="message options"
                                    onClick={(event) => handleMessageOptionsClick(event, message)}
                                    size="small"
                                >
                                    <MoreVertIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ textAlign: isOwnMessage ? 'right' : 'left', fontSize: '0.75rem' }}
                        >
                            {formatTimestamp(message.timestamp)}
                        </Typography>
                    </Box>
                    {renderReactions(message.reactions, message.id)}
                </CardContent>
            </Card>
        </Box>
    );
};

export default MessageBubble;