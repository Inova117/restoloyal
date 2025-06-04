import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { logError, logSecurity } from '@/lib/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  level?: 'page' | 'section' | 'component';
  name?: string;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
}

class ErrorBoundary extends Component<Props, State> {
  private retryCount: number = 0;
  private maxRetries: number = 3;

  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, name = 'Unknown', level = 'component' } = this.props;
    
    // Log error with context
    logError(
      `Error Boundary Caught Error in ${name}`,
      {
        error_message: error.message,
        error_stack: error.stack,
        component_stack: errorInfo.componentStack,
        level,
        retry_count: this.retryCount,
        error_id: this.state.errorId
      },
      `ErrorBoundary-${name}`
    );

    // Check for potential security issues
    if (this.isPotentialSecurityIssue(error)) {
      logSecurity(
        'Potential security-related error detected',
        {
          error_message: error.message,
          component: name,
          error_id: this.state.errorId
        },
        `ErrorBoundary-${name}`
      );
    }

    // Update state with error info
    this.setState({
      errorInfo
    });

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo);
    }

    // Report to external error tracking service in production
    if (!import.meta.env.DEV) {
      this.reportToErrorService(error, errorInfo);
    }
  }

  private isPotentialSecurityIssue(error: Error): boolean {
    const securityKeywords = [
      'unauthorized',
      'forbidden',
      'csrf',
      'xss',
      'injection',
      'authentication',
      'permission'
    ];

    const errorMessage = error.message.toLowerCase();
    return securityKeywords.some(keyword => errorMessage.includes(keyword));
  }

  private async reportToErrorService(error: Error, errorInfo: ErrorInfo): Promise<void> {
    try {
      // Example: Send to Sentry, LogRocket, or custom error service
      await fetch('/api/errors', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          error_id: this.state.errorId,
          message: error.message,
          stack: error.stack,
          component_stack: errorInfo.componentStack,
          timestamp: new Date().toISOString(),
          user_agent: navigator.userAgent,
          url: window.location.href
        })
      });
    } catch (reportError) {
      // Fail silently to avoid infinite error loops
      console.error('Failed to report error to service:', reportError);
    }
  }

  private handleRetry = (): void => {
    if (this.retryCount < this.maxRetries) {
      this.retryCount++;
      logError(
        `Retrying component after error (attempt ${this.retryCount}/${this.maxRetries})`,
        { error_id: this.state.errorId },
        `ErrorBoundary-${this.props.name}`
      );
      
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        errorId: null
      });
    }
  };

  private handleReload = (): void => {
    logError(
      'User triggered page reload after error',
      { error_id: this.state.errorId },
      `ErrorBoundary-${this.props.name}`
    );
    window.location.reload();
  };

  private handleGoHome = (): void => {
    logError(
      'User navigated to home after error',
      { error_id: this.state.errorId },
      `ErrorBoundary-${this.props.name}`
    );
    window.location.href = '/';
  };

  private renderErrorDetails(): ReactNode {
    const { error, errorInfo } = this.state;
    
    if (!import.meta.env.DEV || !error) {
      return null;
    }

    return (
      <details className="mt-4 p-4 bg-gray-50 rounded-lg border">
        <summary className="cursor-pointer font-medium text-gray-700 hover:text-gray-900">
          <Bug className="inline w-4 h-4 mr-2" />
          Technical Details (Development Only)
        </summary>
        <div className="mt-3 space-y-3">
          <div>
            <h4 className="font-medium text-red-600">Error Message:</h4>
            <p className="text-sm text-gray-700 font-mono bg-red-50 p-2 rounded">
              {error.message}
            </p>
          </div>
          {error.stack && (
            <div>
              <h4 className="font-medium text-red-600">Stack Trace:</h4>
              <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {error.stack}
              </pre>
            </div>
          )}
          {errorInfo?.componentStack && (
            <div>
              <h4 className="font-medium text-red-600">Component Stack:</h4>
              <pre className="text-xs text-gray-600 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                {errorInfo.componentStack}
              </pre>
            </div>
          )}
          <div>
            <h4 className="font-medium text-blue-600">Error ID:</h4>
            <p className="text-sm text-gray-700 font-mono bg-blue-50 p-2 rounded">
              {this.state.errorId}
            </p>
          </div>
        </div>
      </details>
    );
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const { level = 'component', name = 'Component' } = this.props;
      const canRetry = this.retryCount < this.maxRetries;

      return (
        <div className="flex items-center justify-center min-h-[200px] p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <CardTitle className="text-red-600">
                {level === 'page' ? 'Page Error' : 
                 level === 'section' ? 'Section Error' : 
                 'Component Error'}
              </CardTitle>
              <CardDescription>
                Something went wrong with the {name.toLowerCase()}. 
                {canRetry ? ' You can try again or reload the page.' : ' Please reload the page.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col gap-2">
                {canRetry && (
                  <Button 
                    onClick={this.handleRetry}
                    className="w-full"
                    variant="default"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again ({this.maxRetries - this.retryCount} attempts left)
                  </Button>
                )}
                
                <Button 
                  onClick={this.handleReload}
                  variant="outline"
                  className="w-full"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reload Page
                </Button>

                {level === 'page' && (
                  <Button 
                    onClick={this.handleGoHome}
                    variant="ghost"
                    className="w-full"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go to Home
                  </Button>
                )}
              </div>

              {this.renderErrorDetails()}

              {!import.meta.env.DEV && (
                <div className="text-xs text-gray-500 text-center">
                  Error ID: {this.state.errorId}
                  <br />
                  Please include this ID when reporting the issue.
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easy wrapping
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
}

// Specialized error boundaries for different levels
export const PageErrorBoundary: React.FC<Omit<Props, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="page" />
);

export const SectionErrorBoundary: React.FC<Omit<Props, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="section" />
);

export const ComponentErrorBoundary: React.FC<Omit<Props, 'level'>> = (props) => (
  <ErrorBoundary {...props} level="component" />
);

export default ErrorBoundary; 