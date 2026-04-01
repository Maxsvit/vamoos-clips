import { Component } from "react";

export default class RouteErrorBoundary extends Component {
  state = { error: null };

  static getDerivedStateFromError(error) {
    return { error };
  }

  render() {
    if (this.state.error) {
      const msg =
        this.state.error instanceof Error
          ? this.state.error.message
          : String(this.state.error);
      return (
        <div className="min-h-screen bg-gray-950 text-white pt-32 px-4 max-w-2xl mx-auto">
          <p className="text-red-400 font-semibold mb-2">
            Помилка на сторінці (див. консоль браузера F12).
          </p>
          <pre className="text-xs text-gray-500 whitespace-pre-wrap break-words">
            {msg}
          </pre>
        </div>
      );
    }
    return this.props.children;
  }
}
