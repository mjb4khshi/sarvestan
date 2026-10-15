import { Component } from 'react';

/** جلوگیری از سفید شدن کل صفحه هنگام خطای runtime */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[Sarvestan Mobile] render error:', error);
    console.error('[Sarvestan Mobile] component stack:', info?.componentStack);
    // اگر error ناشناخته/undefined باشد هم در UI بیاور
    this.setState({
      error: error || new Error('Unknown render error (undefined)'),
      info,
    });
  }

  render() {
    if (this.state.error) {
      const err = this.state.error;
      const msg =
        err?.message ||
        (typeof err === 'string' ? err : '') ||
        String(err) ||
        'undefined';
      return (
        <div
          className="min-h-screen bg-base text-base-content flex flex-col items-center justify-center gap-3 p-6 text-center"
          dir="rtl"
        >
          <p className="text-[15px] font-bold text-danger">خطای رندر صفحه</p>
          <pre className="text-[11px] text-neutral whitespace-pre-wrap max-w-[360px] text-right bg-base-500/30 rounded-xl p-3 border border-base-500/40 font-mono">
            {msg}
            {this.state.info?.componentStack
              ? `\n\n${this.state.info.componentStack.split('\n').slice(0, 8).join('\n')}`
              : ''}
          </pre>
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => {
              this.setState({ error: null, info: null });
              window.location.reload();
            }}
          >
            تلاش دوباره
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
