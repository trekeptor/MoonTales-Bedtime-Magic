
import React from 'react';

const Header: React.FC = () => {
  return (
    <header className="pt-8 pb-4 px-6 flex flex-col items-center justify-center text-center">
      <div className="flex items-center gap-3 mb-2">
        <div className="relative">
           <svg className="w-10 h-10 text-yellow-200 drop-shadow-lg" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
          </svg>
          <div className="absolute -top-1 -right-1">
            <svg className="w-4 h-4 text-white animate-spin-slow" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1L14.39 8.26H22L15.81 12.75L18.19 20L12 15.5L5.81 20L8.19 12.75L2 8.26H9.61L12 1Z" />
            </svg>
          </div>
        </div>
        <h1 className="text-4xl md:text-5xl font-serif text-white tracking-wide">
          MoonTales
        </h1>
      </div>
      <p className="text-blue-200/80 italic text-lg max-w-md mx-auto">
        "Soft whispers and starlight dreams..."
      </p>
      
      <style>{`
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </header>
  );
};

export default Header;
