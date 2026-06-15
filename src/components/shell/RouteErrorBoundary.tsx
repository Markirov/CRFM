import { Component, type ReactNode } from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

interface Props { children: ReactNode }
interface State { error: Error | null }

export class RouteErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: unknown) {
    console.error('[RouteErrorBoundary]', error, info);
  }

  reset = () => this.setState({ error: null });

  reload = () => window.location.reload();

  render() {
    if (!this.state.error) return this.props.children;

    const isChunkError = /chunk|loading|dynamically imported module|Failed to fetch/i
      .test(this.state.error.message);

    return (
      <div className="h-full flex items-center justify-center p-6">
        <div className="bg-surface-container-high border-2 border-error/50 p-6 max-w-md w-full clip-chamfer flex flex-col items-center gap-4">
          <AlertTriangle size={36} className="text-error" />
          <h2 className="font-headline text-lg font-black tracking-tighter uppercase text-error text-center">
            {isChunkError ? 'Error de carga' : 'Error inesperado'}
          </h2>
          <p className="font-mono text-[10px] text-secondary/70 text-center">
            {isChunkError
              ? 'No se pudo descargar este módulo. Posible falta de red o versión obsoleta en caché.'
              : 'Algo falló al renderizar esta página.'}
          </p>
          <pre className="font-mono text-[9px] text-outline bg-background/40 px-3 py-2 w-full overflow-auto max-h-32 whitespace-pre-wrap break-all">
            {this.state.error.message}
          </pre>
          <div className="flex gap-2 w-full">
            <button
              onClick={this.reload}
              className="flex-1 flex items-center justify-center gap-2 h-9 bg-primary-container/10 hover:bg-primary-container/25 border border-primary-container/60 text-primary-container font-mono text-[10px] uppercase tracking-widest transition-colors"
            >
              <RefreshCcw size={12} /> Recargar app
            </button>
            <button
              onClick={this.reset}
              className="flex-1 h-9 border border-outline-variant/40 text-secondary hover:text-on-surface font-mono text-[10px] uppercase tracking-widest transition-colors"
            >
              Reintentar
            </button>
          </div>
        </div>
      </div>
    );
  }
}
