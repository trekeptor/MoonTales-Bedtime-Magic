
import React, { useMemo } from 'react';

const Background: React.FC = () => {
  const stars = useMemo(() => {
    return Array.from({ length: 150 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 3}px`,
      delay: `${Math.random() * 5}s`,
      duration: `${3 + Math.random() * 7}s`,
    }));
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      {/* Deep night gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#050b1a] via-[#0c142e] to-[#1a2b4b]" />
      
      {/* Animated Stars */}
      {stars.map((star) => (
        <div
          key={star.id}
          className="absolute bg-white rounded-full opacity-0 animate-pulse"
          style={{
            top: star.top,
            left: star.left,
            width: star.size,
            height: star.size,
            animation: `pulse ${star.duration} infinite ${star.delay}`,
            boxShadow: '0 0 5px rgba(255, 255, 255, 0.5)',
          }}
        />
      ))}

      {/* Soft glowing moon reflection */}
      <div className="absolute -top-20 -right-20 w-80 h-80 bg-blue-400/10 blur-[100px] rounded-full" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 blur-[120px] rounded-full" />

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(1.2); }
        }
      `}</style>
    </div>
  );
};

export default Background;
