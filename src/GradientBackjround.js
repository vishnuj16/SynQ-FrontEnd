import React, { useState, useEffect } from 'react';

const GradientBackground = () => {
  const [gradient, setGradient] = useState('');

  const gradients = [
    'linear-gradient(to right, #e0eafc, #cfdef3)',
    'linear-gradient(to right, #faaca8, #ffd6ff)',
    'linear-gradient(to right, #ffecd2, #fcb69f)',
    'linear-gradient(to right, #84fab0, #8af39c)',
    'linear-gradient(to right, #f77062, #fe5196)',
  ];

  useEffect(() => {
    let currentGradientIndex = 0;

    const intervalId = setInterval(() => {
      setGradient(gradients[currentGradientIndex]);
      currentGradientIndex = (currentGradientIndex + 1) % gradients.length; // Cycle through gradients
    }, 5000);

    return () => clearInterval(intervalId);
  }, []);

  return (
    <div className="gradient-background" style={{ background: gradient }} />
  );
};

export default GradientBackground;
