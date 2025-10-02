import React, { useEffect, useRef, useState } from 'react';

const AnimatedNumber = ({ value, duration = 800, decimals = 2, className }) => {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef();

  useEffect(() => {
    const start = performance.now();
    const from = prevRef.current;
    const to = value;
    if (!Number.isFinite(from) || !Number.isFinite(to)) {
      setDisplay(value);
      prevRef.current = value;
      return;
    }

    const step = (t) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3); // easeOutCubic
      const current = from + (to - from) * eased;
      setDisplay(Number(current.toFixed(decimals)));
      if (p < 1) {
        rafRef.current = requestAnimationFrame(step);
      } else {
        prevRef.current = value;
      }
    };

    rafRef.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafRef.current);
  }, [value, duration, decimals]);

  return <span className={className}>{Number.isFinite(display) ? display.toFixed(decimals) : '--'}</span>;
};

export default AnimatedNumber;