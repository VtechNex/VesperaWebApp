import React from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import { Button } from './ui/button';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  handleReload = () => {
    window.location.reload();
  };

  handleHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-black flex items-center justify-center px-6">
          <div className="max-w-md w-full">
            <div className="rounded-2xl border border-white/10 bg-black/40 backdrop-blur-xl p-8 text-center">
              <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-red-500/10 border border-red-500/40 text-red-500 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <h1 className="font-serif text-2xl text-white mb-2">
                Oops! Something went wrong
              </h1>
              <p className="text-white/70 mb-6">
                We encountered an unexpected error. Please try refreshing the page or return to the homepage.
              </p>
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 rounded-lg bg-red-900/20 border border-red-500/30 text-left">
                  <p className="text-red-400 text-sm font-mono break-all">
                    {this.state.error.toString()}
                  </p>
                </div>
              )}
              <div className="flex gap-3 justify-center">
                <Button 
                  onClick={this.handleReload}
                  className="inline-flex items-center gap-2 rounded-md border border-white/20 bg-white/10 hover:bg-white/15 text-white px-4 py-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
                <Button 
                  onClick={this.handleHome}
                  className="gold-btn gold-shine inline-flex items-center gap-2"
                >
                  <Home className="h-4 w-4" />
                  Go Home
                </Button>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
