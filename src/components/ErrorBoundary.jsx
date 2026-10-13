import { Component } from 'react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // eslint-disable-next-line no-console
    console.error('Unhandled error caught by ErrorBoundary:', error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 24, textAlign: 'center' }}>
          <h2 style={{ marginBottom: 8 }}>Something went wrong</h2>
          <p style={{ color: 'var(--ink-soft, #5b6764)', marginBottom: 16, fontSize: '0.9rem' }}>
            The app hit an unexpected error. Your data is safe — it's saved on your device.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => this.setState({ hasError: false })}
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
