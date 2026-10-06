import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string | null;
}

/**
 * App-level error boundary: catches render-time crashes anywhere below it
 * and shows a friendly fallback with a reload button.
 */
export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, message: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // In a real app this would go to an error-reporting service (Sentry etc.)
    console.error('Uncaught render error:', error, info.componentStack);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4">
          <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-6 text-center shadow-sm">
            <p className="text-4xl">😵</p>
            <h1 className="mt-3 text-lg font-semibold text-gray-900">
              Something went wrong
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              The app hit an unexpected error. Reloading usually fixes it.
            </p>
            {this.state.message && (
              <p className="mt-3 rounded-lg bg-gray-50 px-3 py-2 text-left text-xs text-gray-400">
                {this.state.message}
              </p>
            )}
            <button
              onClick={this.handleReload}
              className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              ⟳ Reload app
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
