import React, { useState, useEffect } from 'react';

export interface ToastMessage {
  id: string;
  type: 'error' | 'success' | 'info';
  message: string;
}

const GlobalToast: React.FC = () => {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  useEffect(() => {
    const handleApiError = (event: Event) => {
      const customEvent = event as CustomEvent<{ message: string; type?: 'error' | 'success' | 'info' }>;
      const { message, type = 'error' } = customEvent.detail;
      const id = Math.random().toString(36).substring(2, 9);
      
      setToasts(prev => [...prev, { id, message, type }]);

      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id));
      }, 5000);
    };

    window.addEventListener('app-toast', handleApiError);
    return () => window.removeEventListener('app-toast', handleApiError);
  }, []);

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`px-4 py-3 rounded-lg shadow-lg max-w-sm pointer-events-auto transform transition-all duration-300 translate-y-0 opacity-100 ${
            toast.type === 'error' ? 'bg-red-600 text-white' :
            toast.type === 'success' ? 'bg-emerald-600 text-white' :
            'bg-surface-container-high text-on-surface'
          }`}
        >
          <div className="flex justify-between items-start gap-3">
            <p className="text-sm font-medium">{toast.message}</p>
            <button
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-white/70 hover:text-white"
            >
              <span className="material-symbols-outlined text-[16px]">close</span>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default GlobalToast;
