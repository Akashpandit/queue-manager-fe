import { Component } from "react";

export default class ErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="page">
        <h1>Something went wrong</h1>
        <p className="error">{String(this.state.error.message || this.state.error)}</p>
        <button onClick={() => window.location.reload()}>Reload</button>
      </div>
    );
  }
}