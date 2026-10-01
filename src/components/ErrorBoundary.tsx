import React, { Component, ErrorInfo, ReactNode } from 'react';
import { RefreshCw, RotateCcw, AlertTriangle } from 'lucide-react';
import { STORAGE_KEY } from '../services/storage';

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  public static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleResetLocal = (): void => {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    } catch {
      // Ignorar
    }
    window.location.reload();
  };

  public render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#0a0a0b] text-[#e0e0e0] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#141418] border border-[#2a2a2e] rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-[#c5a059]/10 border border-[#c5a059]/30 flex items-center justify-center text-[#c5a059]">
              <AlertTriangle size={32} />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-serif text-white font-semibold">
                Inconveniente al cargar la vista
              </h2>
              <p className="text-xs text-[#a0a0ab]">
                Ocurrió un error inesperado al renderizar la aplicación. Tus datos en Firestore siguen seguros.
              </p>
            </div>

            {this.state.error && (
              <div className="bg-[#0e0e12] border border-[#24242c] p-3 rounded-xl text-left max-h-32 overflow-auto text-xs font-mono text-red-400">
                {this.state.error.toString()}
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                onClick={this.handleReload}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#c5a059] hover:bg-[#d4b068] text-black font-semibold rounded-xl text-xs uppercase tracking-wider transition-colors cursor-pointer"
              >
                <RefreshCw size={14} />
                Recargar aplicación
              </button>

              <button
                onClick={this.handleResetLocal}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-[#1e1e24] hover:bg-[#282830] text-[#a0a0ab] hover:text-white rounded-xl text-xs transition-colors cursor-pointer"
              >
                <RotateCcw size={14} />
                Limpiar datos locales temporales
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
