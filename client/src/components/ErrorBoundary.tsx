import { cn } from "@/lib/utils";
import { AlertTriangle, RotateCcw, Copy, Check } from "lucide-react";
import { Component, ReactNode, ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  copied: boolean;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null, copied: false };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({ errorInfo });
    
    // Log detailed error info to console for debugging
    console.group('🔴 ErrorBoundary Details');
    console.log('Component:', this.props.name || 'Unknown');
    console.log('Error:', error.message);
    console.log('Stack:', error.stack);
    console.log('Component Stack:', errorInfo.componentStack);
    console.groupEnd();
  }

  handleCopyError = async () => {
    const errorText = `
Error: ${this.state.error?.message}
Component: ${this.props.name || 'Unknown'}
Stack: ${this.state.error?.stack}
Component Stack: ${this.state.errorInfo?.componentStack}
    `.trim();
    
    try {
      await navigator.clipboard.writeText(errorText);
      this.setState({ copied: true });
      setTimeout(() => this.setState({ copied: false }), 2000);
    } catch (err) {
      console.error('Failed to copy error:', err);
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex items-center justify-center min-h-screen p-8 bg-background">
          <div className="flex flex-col items-center w-full max-w-4xl p-8">
            <AlertTriangle
              size={48}
              className="text-destructive mb-6 flex-shrink-0"
            />

            <h2 className="text-xl mb-2">An unexpected error occurred{this.props.name ? ` in ${this.props.name}` : ''}.</h2>
            <p className="text-sm text-muted-foreground mb-4 font-mono">{this.state.error?.message}</p>

            <div className="p-4 w-full rounded bg-muted overflow-auto mb-6 max-h-96">
              <p className="text-xs font-bold text-muted-foreground mb-2">Error Stack:</p>
              <pre className="text-xs text-muted-foreground whitespace-break-spaces mb-4">
                {this.state.error?.stack}
              </pre>
              {this.state.errorInfo && (
                <>
                  <p className="text-xs font-bold text-muted-foreground mb-2">Component Stack:</p>
                  <pre className="text-xs text-muted-foreground whitespace-break-spaces">
                    {this.state.errorInfo.componentStack}
                  </pre>
                </>
              )}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-primary text-primary-foreground",
                  "hover:opacity-90 cursor-pointer"
                )}
              >
                <RotateCcw size={16} />
                Reload Page
              </button>
              <button
                onClick={this.handleCopyError}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg",
                  "bg-muted text-muted-foreground border border-border",
                  "hover:bg-accent cursor-pointer"
                )}
              >
                {this.state.copied ? (
                  <><Check size={16} /> Copied!</>
                ) : (
                  <><Copy size={16} /> Copy Error</>
                )}
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
