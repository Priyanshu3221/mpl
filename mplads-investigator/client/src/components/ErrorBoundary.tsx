import { Component, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an unhandled rendering error:", error, errorInfo);
  }

  resetError = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="flex items-center justify-center p-8 bg-[#fff9f9] border border-[#e7c9c9] rounded-lg my-4 text-[#102a43]">
          <div className="flex flex-col items-center w-full max-w-xl text-center">
            <AlertTriangle size={36} className="text-[#a34d4d] mb-4 shrink-0" />
            <h2 className="text-lg font-semibold text-[#7c3030] mb-2">An unexpected frontend rendering error occurred</h2>
            <p className="text-xs text-[#8b5b5b] mb-4 max-w-md">
              {this.state.error?.message || "Component failed to render cleanly. You can attempt to retry the view."}
            </p>
            <div className="flex items-center gap-3">
              <button
                onClick={this.resetError}
                className="flex items-center gap-2 px-4 py-2 rounded-md bg-[#102a43] text-white hover:bg-[#193c59] text-xs font-semibold transition-colors"
              >
                <RotateCcw size={14} />
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 rounded-md border border-[#dce5ee] bg-white text-[#607387] hover:bg-[#f1f5f8] text-xs font-semibold"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;

