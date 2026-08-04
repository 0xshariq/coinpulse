'use client';

import React, { ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200">
            <div className="text-center">
              <h2 className="text-lg font-semibold text-red-900 mb-2">
                Something went wrong
              </h2>
              <p className="text-sm text-red-700">
                {this.state.error?.message || 'An unexpected error occurred'}
              </p>
            </div>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
