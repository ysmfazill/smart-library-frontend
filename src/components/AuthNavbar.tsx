import React from 'react';

interface AuthNavbarProps {
  rightLink?: { label: string; href: string; onClick?: () => void };
}

const AuthNavbar: React.FC<AuthNavbarProps> = ({ rightLink }) => {
  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-10 h-20 bg-surface/80 backdrop-blur-md border-b border-outline-variant/20 transition-all duration-300">
      <div className="flex items-center gap-3">
        <img
          alt="Aethelgard AI Logo"
          className="h-10 w-10 rounded-md object-contain"
          src="https://lh3.googleusercontent.com/aida/AP1WRLuDL6CpGuHMcP2WfvyTHHsNb0i9cpPtJO_tma41vC7bfloYv7BGzbG8NTHrag9YmAueu-VYtm4EPpS3js4Oh-Cj2z7uiYGDMWnSnVUBUlo_j4lWujbI6siLiLrRktCGMIlwXcOW5wWK1_LzQ5PZzkOIaN6lz2n4E8jbyUjfC8w86zo_RN0Oazc0ST2NkzgzF9mo7ewZgjMWVy8lYWiJuZrouTMfuZ2GEBTmmqtGA0mf5ezhombgflLBYA"
        />
        <span className="text-2xl font-bold tracking-tight text-primary">Aethelgard AI</span>
      </div>
      {rightLink && (
        <a
          href={rightLink.href}
          onClick={rightLink.onClick}
          className="text-sm font-semibold text-primary hover:underline"
        >
          {rightLink.label}
        </a>
      )}
    </header>
  );
};

export default AuthNavbar;
