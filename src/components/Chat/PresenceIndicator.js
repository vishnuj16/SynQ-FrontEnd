// PresenceIndicator.jsx
import React from 'react';
import { Box, Tooltip, Typography } from '@mui/material';
import { formatDistanceToNow } from 'date-fns';

const PresenceIndicator = ({ status, timestamp, setLastseen, size = 10 }) => {
  const getColor = () => {
    if (status === 'online') return '#44b700';
    return '#ff0000';
  };
  
  const getTooltipText = () => {
    if (status === 'online') return 'Online';
    setLastseen('Online')
    if (timestamp) {
    setLastseen('Last seen ' + formatDistanceToNow(new Date(timestamp)) + ' ago');
      return `Last seen ${formatDistanceToNow(new Date(timestamp))} ago`;
    }
    return 'Offline';
  };

  return (
    <Tooltip title={getTooltipText()} arrow>
      <Box
        sx={{
          width: size,
          height: size,
          borderRadius: '50%',
          backgroundColor: getColor(),
          padding: 1,
        //   marginTop: 1,
        //   marginBottom: 1.5,
          border: '1px solid #fff',
          display: 'inline-block',
          marginRight: 1,
          marginLeft: 1,
          lineHeight:0.1,
        }}
      />
    </Tooltip>
  );
};

export default PresenceIndicator;