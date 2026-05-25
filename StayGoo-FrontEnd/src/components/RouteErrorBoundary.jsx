import { Component } from "react";
import { Link } from "react-router-dom";

export class RouteErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: "" };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      message: error?.message || "Error inesperado al cargar la pagina.",
    };
  }

  componentDidCatch(error, info) {
    console.error("Route render error:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          style={{
            minHeight: "100svh",
            display: "grid",
            placeItems: "center",
            padding: 24,
            fontFamily: "system-ui, sans-serif",
            background: "#0f172a",
            color: "#f8fafc",
            textAlign: "center",
          }}
        >
          <div>
            <h1 style={{ marginBottom: 8 }}>No se pudo cargar esta pagina</h1>
            <p style={{ marginBottom: 16, opacity: 0.85 }}>{this.state.message}</p>
            <Link to="/" style={{ color: "#ff815f", fontWeight: 700 }}>
              Volver al inicio
            </Link>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
