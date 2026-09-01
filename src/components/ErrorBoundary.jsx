import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-screen p-6 text-center">
          <p className="text-lg font-bold mb-2">Algo salió mal</p>
          <p className="text-sm text-text-secondary mb-4">
            La app encontró un error inesperado.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium"
          >
            Reiniciar app
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
