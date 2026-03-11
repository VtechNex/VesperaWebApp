import React from 'react';

const Loading = ({ message = "Loading..." }) => {
  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-50">
      <div className="text-center">
        <div className="relative inline-flex">
          <div className="h-12 w-12 rounded-full border-2 border-white/20"></div>
          <div className="absolute inset-0 h-12 w-12 rounded-full border-2 border-gold border-t-transparent animate-spin"></div>
        </div>
        <p className="mt-4 text-white/70 text-sm">{message}</p>
      </div>
    </div>
  );
};

export default Loading;
