import React from 'react';
import {
    Box,
    Typography,
    IconButton,
    Paper,
    Avatar,
    Card,
    CardContent,
    Chip,
    List,
    ListItem,
    ListItemText,
    ListItemAvatar,
    alpha
} from '@mui/material';
import {
    MoreVert as MoreVertIcon,
    Reply as ReplyIcon,
    Forward as ForwardIcon,
    LinkOutlined as LinkIcon,
    Description as DocumentIcon,
    Image as ImageIcon,
    PictureAsPdf as PdfIcon,
    MusicNote as AudioIcon,
    Videocam as VideoIcon,
    Code as CodeIcon,
    Archive as ArchiveIcon,
    Download as DownloadIcon
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
    const parseMessageContent = (content, hasLinkPreview) => {
        const gifRegex = /\[GIF:(.*?)\]/;
        const urlRegex = /(https?:\/\/[^\s]+)/g;
    
        // Remove GIF markup and extract the URL if present
        const match = content.match(gifRegex);
        if (match) {
            const gifUrl = match[1];
            const textContent = content.replace(gifRegex, '').trim();
            
            return (
                <>
                    {textContent && <Typography variant="body2" color="text.primary">{textContent}</Typography>}
                    <Box sx={{ maxWidth: '100%', borderRadius: 2, overflow: 'hidden', mt: textContent ? 1 : 0 }}>
                        <img src={gifUrl} alt="GIF" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
                    </Box>
                </>
            );
        }
    
        // Remove URLs if link preview exists
        if (hasLinkPreview) {
            content = content.replace(urlRegex, '').trim();
        }
    
        return <Typography variant="body2" color="text.primary">{content}</Typography>;
    };
    
    // Get file icon based on file type
    const getFileIcon = (filename) => {
        const extension = filename.split('.').pop().toLowerCase();
        
        // Image files
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp', 'svg', 'tiff'].includes(extension)) {
            return <ImageIcon sx={{ color: '#4CAF50' }} />;
        }
        
        // Document files
        if (['doc', 'docx', 'txt', 'rtf', 'odt'].includes(extension)) {
            return <DocumentIcon sx={{ color: '#2196F3' }} />;
        }
        
        // PDF files
        if (extension === 'pdf') {
            return <PdfIcon sx={{ color: '#F44336' }} />;
        }
        
        // Audio files
        if (['mp3', 'wav', 'ogg', 'aac', 'flac'].includes(extension)) {
            return <AudioIcon sx={{ color: '#9C27B0' }} />;
        }
        
        // Video files
        if (['mp4', 'avi', 'mov', 'mkv', 'wmv', 'webm'].includes(extension)) {
            return <VideoIcon sx={{ color: '#FF9800' }} />;
        }
        
        // Code files
        if (['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'c', 'cpp', 'cs', 'html', 'css', 'php', 'rb', 'go', 'swift'].includes(extension)) {
            return <CodeIcon sx={{ color: '#673AB7' }} />;
        }
        
        // Archive files
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(extension)) {
            return <ArchiveIcon sx={{ color: '#795548' }} />;
        }
        
        // Default
        return <DocumentIcon sx={{ color: '#607D8B' }} />;
    };

    // Render link preview if available
    const renderLinkPreview = (linkPreview) => {
        if (!linkPreview) return null;
        
        return (
            <Box 
                sx={{ 
                    mt: 1,
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: 2,
                    overflow: 'hidden',
                    backgroundColor: (theme) => isOwnMessage ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.background.paper, 0.6),
                    transition: 'transform 0.2s',
                    '&:hover': {
                        transform: 'translateY(-2px)',
                        boxShadow: 1
                    }
                }}
                onClick={() => window.open(linkPreview.url, '_blank')}
            >
                <Box sx={{ display: 'flex', alignItems: 'stretch' }}>
                    {linkPreview.image && (
                        <Box 
                            component="img" 
                            src={linkPreview.image} 
                            alt="Link preview"
                            sx={{
                                height: 90,
                                width: 90,
                                objectFit: 'cover',
                            }}
                        />
                    )}
                    <Box sx={{ p: 1, flex: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                            {linkPreview.title || 'Untitled'}
                        </Typography>
                        {linkPreview.description && (
                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 0.5 }}>
                                {linkPreview.description.substring(0, 100)}
                                {linkPreview.description.length > 100 ? '...' : ''}
                            </Typography>
                        )}
                        <Typography variant="caption" sx={{ color: 'text.secondary', display: 'flex', alignItems: 'center' }}>
                            <LinkIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.75rem' }} />
                            {linkPreview.site_name || new URL(linkPreview.url).hostname}
                        </Typography>
                    </Box>
                </Box>
            </Box>
        );
    };

    // Render file attachments if available
    const renderFileAttachments = (files) => {
        if (!files || files.length === 0) return null;
        
        return (
            <Box sx={{ mt: 1 }}>
                <List dense disablePadding sx={{ bgcolor: 'transparent' }}>
                    {files.map((file) => (
                        <ListItem 
                            key={file.id}
                            sx={{ 
                                bgcolor: (theme) => isOwnMessage ? alpha(theme.palette.primary.main, 0.08) : alpha(theme.palette.background.paper, 0.6),
                                borderRadius: 2,
                                mb: 0.5,
                                border: '1px solid',
                                borderColor: 'divider',
                                p: 0.75,
                                transition: 'all 0.2s ease',
                                '&:hover': {
                                    transform: 'translateY(-2px)',
                                    boxShadow: 1
                                }
                            }}
                        >
                            <ListItemAvatar sx={{ minWidth: 40 }}>
                                {getFileIcon(file.filename)}
                            </ListItemAvatar>
                            <ListItemText 
                                primary={file.filename} 
                                secondary={formatFileSize(file.size)}
                                primaryTypographyProps={{ 
                                    variant: 'body2', 
                                    noWrap: true,
                                    fontWeight: 500
                                }}
                                secondaryTypographyProps={{ 
                                    variant: 'caption',
                                    sx: { color: isOwnMessage ? 'primary.dark' : 'text.secondary' }
                                }}
                            />
                            <IconButton 
                                size="small" 
                                edge="end" 
                                onClick={() => handleFileDownload(file.id, file.filename)}
                                sx={{ 
                                    bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.primary.main, 0.1),
                                    color: 'primary.main',
                                    '&:hover': {
                                        bgcolor: (theme) => theme.palette.mode === 'dark' ? alpha(theme.palette.primary.main, 0.3) : alpha(theme.palette.primary.main, 0.2),
                                    }
                                }}
                            >
                                <DownloadIcon fontSize="small" />
                            </IconButton>
                        </ListItem>
                    ))}
                </List>
            </Box>
        );
    };

    // Format file size to human-readable format
    const formatFileSize = (sizeInBytes) => {
        if (sizeInBytes < 1024) {
            return `${sizeInBytes} B`;
        } else if (sizeInBytes < 1024 * 1024) {
            return `${(sizeInBytes / 1024).toFixed(1)} KB`;
        } else if (sizeInBytes < 1024 * 1024 * 1024) {
            return `${(sizeInBytes / (1024 * 1024)).toFixed(1)} MB`;
        } else {
            return `${(sizeInBytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
        }
    };

    // Handle file download
    const handleFileDownload = async (fileId, filename) => {
        // Create download URL
        const downloadUrl = `http://localhost:8000/api/chat/${fileId}/download/`;
        console.log('fileId', fileId);
    
        // Fetch the file with the bearer token
        try {
            const response = await fetch(downloadUrl, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('token')}`,
                },
            });
    
            if (!response.ok) {
                throw new Error('Failed to download the file');
            }
    
            // Convert the response to a blob
            const blob = await response.blob();
    
            // Create a download link and trigger the download
            const link = document.createElement('a');
            const url = URL.createObjectURL(blob);
            link.href = url;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
    
            // Clean up the object URL
            URL.revokeObjectURL(url);
        } catch (error) {
            console.error('Error downloading the file:', error);
        }
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
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {Object.entries(reactionCounts).map(([emoji, count]) => (
                    <Chip
                        key={emoji}
                        label={`${emoji} ${count}`}
                        size="small"
                        sx={{
                            height: 22,
                            fontSize: '0.75rem',
                            bgcolor: (theme) => isOwnMessage ? alpha(theme.palette.primary.main, 0.15) : alpha(theme.palette.action.selected, 0.8),
                            borderRadius: '12px',
                            borderColor: (theme) => isOwnMessage ? alpha(theme.palette.primary.main, 0.3) : 'transparent',
                            border: '1px solid',
                            '&:hover': {
                                bgcolor: (theme) => isOwnMessage ? alpha(theme.palette.primary.main, 0.2) : alpha(theme.palette.action.selected, 0.9),
                            }
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
                mb: 1.5,
                display: 'flex',
                flexDirection: 'column',
                alignItems: isOwnMessage ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                alignSelf: isOwnMessage ? 'flex-end' : 'flex-start',
            }}
        >
            {showReply && (
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 1, 
                        bgcolor: (theme) => alpha(theme.palette.action.hover, 0.7), 
                        borderRadius: 2, 
                        mb: 0.5,
                        maxWidth: "100%",
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center' }}>
                        <ReplyIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem' }} />
                        {message.replied_message}
                    </Typography>
                </Paper>
            )}

            
            {showSender && (
                <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    mb: 0.5, 
                    ml: isOwnMessage ? 0 : 1, 
                    mr: isOwnMessage ? 1 : 0 
                }}>
                    {!isOwnMessage && (
                        <Avatar 
                            sx={{ 
                                width: 24, 
                                height: 24, 
                                mr: 0.5, 
                                bgcolor: 'primary.light', 
                                fontSize: '0.75rem',
                                boxShadow: 1
                            }}
                        >
                            {message.sender?.charAt(0).toUpperCase()}
                        </Avatar>
                    )}
                    <Typography
                        variant="subtitle2"
                        color="text.primary"
                        sx={{
                            display: 'block',
                            fontWeight: 500,
                        }}
                    >
                        {message.sender}
                    </Typography>
                    {isOwnMessage && (
                        <Avatar 
                            sx={{ 
                                width: 24, 
                                height: 24, 
                                ml: 0.5, 
                                bgcolor: 'primary.light', 
                                fontSize: '0.75rem',
                                boxShadow: 1
                            }}
                        >
                            {message.sender?.charAt(0).toUpperCase()}
                        </Avatar>
                    )}
                </Box>
            )}

            {message.is_edited && (
                    <Typography 
                        variant="caption" 
                        color="text.secondary" 
                        sx={{ mb: 0.5, fontStyle: 'italic', opacity: 0.7 }}
                    >
                        Edited
                    </Typography>
                )}

            {showIfForwarded && (
                <Paper 
                    elevation={0} 
                    sx={{ 
                        p: 1, 
                        bgcolor: (theme) => alpha(theme.palette.action.hover, 0.7), 
                        borderRadius: 2, 
                        mb: 0.5,
                        maxWidth: "100%",
                        border: '1px solid',
                        borderColor: 'divider',
                    }}
                >
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center'}}>
                        <ForwardIcon fontSize="small" sx={{ mr: 0.5, fontSize: '0.875rem' }} />
                        Forwarded...
                    </Typography>
                </Paper>
            )}

            <Card
                elevation={isOwnMessage ? 2 : 1}
                sx={{
                    backgroundColor: (theme) => isOwnMessage 
                        ? alpha(theme.palette.primary.main, 0.1)
                        : theme.palette.mode === 'dark' 
                            ? alpha(theme.palette.background.paper, 0.6)
                            : alpha(theme.palette.background.paper, 0.85),
                    borderRadius: 3,
                    maxWidth: '100%',
                    wordBreak: 'break-word',
                    border: '1px solid',
                    borderColor: (theme) => isOwnMessage 
                        ? alpha(theme.palette.primary.main, 0.3)
                        : 'divider',
                    transition: 'box-shadow 0.2s',
                    '&:hover': {
                        boxShadow: 2
                    }
                }}
            >
                <CardContent
                    sx={{
                        p: 1.5,
                        '&:last-child': { pb: 1.5 },
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
                                {parseMessageContent(message.content, !!message.link_preview)}
                                {message.link_preview && renderLinkPreview(message.link_preview)}
                                {message.attachments && renderFileAttachments(message.attachments)}
                            </Box>
                            <Box sx={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
                                <IconButton
                                    aria-label="message options"
                                    onClick={(event) => handleMessageOptionsClick(event, message)}
                                    size="small"
                                    sx={{ 
                                        bgcolor: (theme) => theme.palette.mode === 'dark' 
                                            ? alpha(theme.palette.background.paper, 0.6)
                                            : alpha(theme.palette.background.paper, 0.6),
                                        '&:hover': {
                                            bgcolor: (theme) => theme.palette.mode === 'dark' 
                                                ? alpha(theme.palette.background.paper, 0.8)
                                                : alpha(theme.palette.background.paper, 0.8),
                                        },
                                        borderRadius: '50%',
                                        p: 0.5,
                                    }}
                                >
                                    <MoreVertIcon fontSize="small" />
                                </IconButton>
                            </Box>
                        </Box>
                        
                        {/* Combined time and reactions row */}
                        <Box sx={{ 
                            display: 'flex', 
                            justifyContent: isOwnMessage ? 'flex-end' : 'flex-start',
                            alignItems: 'center',
                            mt: 0.5,
                            gap: 1
                        }}>
                            {/* Show reactions first for non-own messages */}
                            {!isOwnMessage && message.reactions && Object.keys(message.reactions).length > 0 && 
                                renderReactions(message.reactions, message.id)}
                            
                            <Typography
                                variant="caption"
                                color="text.secondary"
                                sx={{ 
                                    fontSize: '0.7rem', 
                                    opacity: 0.8,
                                    whiteSpace: 'nowrap'
                                }}
                            >
                                {formatTimestamp(message.timestamp)}
                            </Typography>
                            
                            {/* Show reactions last for own messages */}
                            {isOwnMessage && message.reactions && Object.keys(message.reactions).length > 0 && 
                                renderReactions(message.reactions, message.id)}
                        </Box>
                    </Box>
                </CardContent>
            </Card>
        </Box>
    );
};

export default MessageBubble;