import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, info) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return null; // إخفاء المنشور المعطوب فقط بدلاً من إظهار رسالة خطأ
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
