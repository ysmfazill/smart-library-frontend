import { Component, type ErrorInfo, type ReactNode } from 'react';
import AppLayout from './AppLayout';

interface Props {
  children: ReactNode;
  fallbackMessage?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <AppLayout>
          <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
            <div className="w-16 h-16 rounded-full bg-error/10 text-error flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-3xl">warning</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-on-surface mb-2">
              Something went wrong
            </h2>
            <p className="text-xs sm:text-sm text-on-surface-variant max-w-md mb-6">
              {this.props.fallbackMessage || "An unexpected error occurred while displaying this page."}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-5 py-2.5 rounded-xl border border-outline-variant/30 text-on-surface text-sm font-semibold hover:bg-surface-container transition-colors min-h-[44px]"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/search'}
                className="px-5 py-2.5 rounded-xl ai-gradient-bg text-white text-sm font-semibold shadow-md hover:opacity-90 transition-opacity min-h-[44px]"
              >
                Back to Search
              </button>
            </div>
          </div>
        </AppLayout>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
