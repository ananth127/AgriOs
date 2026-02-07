/**
 * React Error Boundary for catching and logging component errors
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import logger from './index';
import { LogCategory } from './types';

interface Props {
    children: ReactNode;
    fallback?: ReactNode | ((error: Error, errorInfo: ErrorInfo) => ReactNode);
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    boundaryName?: string;
}

interface State {
    hasError: boolean;
    error: Error | null;
    errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
    constructor(props: Props) {
        super(props);
        this.state = {
            hasError: false,
            error: null,
            errorInfo: null,
        };
    }

    static getDerivedStateFromError(error: Error): Partial<State> {
        return {
            hasError: true,
            error,
        };
    }

    componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
        // Log error to our logging system
        logger.error(
            `Error in ${this.props.boundaryName || 'React component'}`,
            LogCategory.RENDER,
            error,
            {
                errorLog: {
                    message: error.message,
                    stack: error.stack,
                    componentStack: errorInfo.componentStack,
                    boundary: this.props.boundaryName,
                    recoverable: true,
                },
            }
        );

        // Call custom error handler if provided
        this.props.onError?.(error, errorInfo);

        // Update state
        this.setState({
            errorInfo,
        });
    }

    render(): ReactNode {
        if (this.state.hasError && this.state.error) {
            // Render custom fallback if provided
            if (this.props.fallback) {
                if (typeof this.props.fallback === 'function') {
                    return this.props.fallback(
                        this.state.error,
                        this.state.errorInfo!
                    );
                }
                return this.props.fallback;
            }

            // Default error UI
            return (
                <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
                    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
                        <div className="flex items-center mb-4">
                            <div className="flex-shrink-0">
                                <svg
                                    className="h-8 w-8 text-red-500"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                                    />
                                </svg>
                            </div>
                            <div className="ml-3">
                                <h3 className="text-lg font-medium text-gray-900">
                                    Something went wrong
                                </h3>
                            </div>
                        </div>

                        <div className="mt-2 text-sm text-gray-600">
                            <p className="mb-2">
                                We&apos;re sorry, but something unexpected happened. The error has been logged and we&apos;ll look into it.
                            </p>

                            {process.env.NODE_ENV === 'development' && this.state.error && (
                                <details className="mt-4 p-3 bg-gray-100 rounded text-xs">
                                    <summary className="cursor-pointer font-semibold text-red-700">
                                        Error Details (Development Only)
                                    </summary>
                                    <pre className="mt-2 whitespace-pre-wrap break-words">
                                        {this.state.error.toString()}
                                        {this.state.errorInfo?.componentStack}
                                    </pre>
                                </details>
                            )}
                        </div>

                        <div className="mt-6">
                            <button
                                onClick={() => window.location.reload()}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
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
