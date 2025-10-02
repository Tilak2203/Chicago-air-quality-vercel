import React, { useState, useEffect } from "react";

const RealtimeClock = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatUTCTime12h = (date) => {
    let hours = date.getUTCHours();
    const minutes = String(date.getUTCMinutes()).padStart(2, '0');
    const seconds = String(date.getUTCSeconds()).padStart(2, '0');
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, '0');
    const day = String(date.getUTCDate()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    if (hours === 0) hours = 12;
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${ampm} GMT`;
  };

  return (
    <div title="Current time in GMT" style={{ fontWeight: 600 }}>
      {formatUTCTime12h(currentTime)}
    </div>
  );
};

export default RealtimeClock;