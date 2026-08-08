import React from 'react';

interface AuthNavbarProps {
  rightLink?: { label: string; href: string; onClick?: () => void };
}

const AuthNavbar: React.FC<AuthNavbarProps> = ({ rightLink }) => {
  return (
    <header className="fixed top-0 w-full z-50 flex justify-between items-center px-4 sm:px-10 h-16 sm:h-20 bg-surface/80 backdrop-blur-md border-b border-outline-variant/20 transition-all duration-300">
      <div className="flex items-center gap-2.5 sm:gap-3">
        <img
          alt="Readify App Logo"
          className="h-10 sm:h-12 w-auto object-contain shrink-0"
          src="/logo.png"
        />
        <span className="text-lg sm:text-2xl font-bold tracking-tight text-primary">Readify App</span>
      </div>
      {rightLink && (
        <a
          href={rightLink.href}
          onClick={rightLink.onClick}
          className="text-xs sm:text-sm font-semibold text-primary hover:underline py-2 px-3 rounded-lg hover:bg-primary/5 transition-colors"
        >
          {rightLink.label}
        </a>
      )}
    </header>
  );
};

export default AuthNavbar;
