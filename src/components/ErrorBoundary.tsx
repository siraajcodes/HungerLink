import React from 'react';

interface State {
  hasError: boolean;
  message: string;
}

export class ErrorBoundary extends React.Component<{ children: React.ReactNode }, State> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message || 'An unexpected application error occurred.' };
  }

  componentDidCatch(error: Error) {
    console.error('[HUNGERLINK ErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#FFF9EF] text-[#123B35] flex items-center justify-center p-6">
          <div className="max-w-lg w-full bg-white border border-[#123B35]/15 rounded-2xl p-8">
            <h1 className="text-xl font-bold font-display text-[#123B35]">
              Application View Interrupted
            </h1>
            <p className="mt-2 text-sm text-[#64748B] leading-relaxed">
              {this.state.message}
            </p>
            <div className="mt-6 flex items-center gap-3">
              <button
                type="button"
                onClick={() => this.setState({ hasError: false, message: '' })}
                className="px-4 py-2 rounded-lg bg-[#123B35] text-white text-sm font-medium hover:bg-[#0B2723] transition-colors"
              >
                Retry View
              </button>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-lg border border-[#123B35]/20 text-[#123B35] text-sm font-medium hover:bg-[#FFF9EF] transition-colors"
              >
                Reload Application
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
