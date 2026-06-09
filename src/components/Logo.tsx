import React from 'react';

export const Logo = ({ size = 48, className = "" }: { size?: number, className?: string }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <rect width="100" height="100" rx="25" fill="#1F1F1F" />
      
      {/* Book / Diary Pages */}
      <path d="M28 35C28 30 38 28 50 32C62 28 72 30 72 35V75C72 70 62 70 50 75C38 70 28 70 28 75V35Z" fill="#FAF9F6" />
      
      {/* Bookmark */}
      <path d="M62 30V48L57 44L52 48V31.5C56 30 59 30 62 30Z" fill="#E3E3CC" />

      {/* Heart */}
      <path d="M50 58.5C50 58.5 40 48 40 42C40 38.5 43 36 46 36C47.8 36 49 37 50 38.5C51 37 52.2 36 54 36C57 36 60 38.5 60 42C60 48 50 58.5 50 58.5Z" fill="#1F1F1F" />
    </svg>
  );
};
