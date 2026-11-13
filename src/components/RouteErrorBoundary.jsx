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
        <div className="vc-root">
          <div className="mx-auto flex max-w-[1320px] flex-col gap-5 px-4 py-24 sm:px-6">
            <span className="vc-mono text-[13px] text-[#ff8a7a]">✕ ПОМИЛКА НА СТОРІНЦІ</span>
            <h1 className="vc-display m-0 text-[clamp(32px,5vw,64px)] font-black uppercase leading-[0.95]">
              Щось зламалось
            </h1>
            <p className="m-0 text-[var(--vc-muted)]">Онови сторінку. Деталі є в консолі браузера (F12).</p>
            <pre className="vc-mono m-0 whitespace-pre-wrap break-words border border-[var(--vc-line)] p-4 text-xs text-[var(--vc-muted)]">
              {msg}
            </pre>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
