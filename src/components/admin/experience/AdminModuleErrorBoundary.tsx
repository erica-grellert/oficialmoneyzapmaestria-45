import React, { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Props {
  title: string;
  children: ReactNode;
}

interface State {
  hasError: boolean;
  message: string;
}

class AdminModuleErrorBoundary extends Component<Props, State> {
  state: State = {
    hasError: false,
    message: "",
  };

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      message: error.message || "Este módulo encontrou um erro inesperado.",
    };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Admin module failed:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="admin-surface p-6">
          <div className="flex items-start gap-3">
            <div className="rounded-2xl bg-orange-50 p-3">
              <AlertTriangle className="h-5 w-5 text-[var(--admin-danger)]" />
            </div>
            <div className="flex-1">
              <h3 className="admin-display text-2xl">{this.props.title}</h3>
              <p className="mt-2 text-sm text-[var(--admin-muted)]">
                Este módulo está temporariamente indisponível. O endpoint ou a
                dependência subjacente pode estar ausente ou com falha.
              </p>
              <p className="mt-3 rounded-xl bg-black/[0.03] px-3 py-2 text-xs text-[var(--admin-ink-soft)]">
                {this.state.message}
              </p>
              <Button
                type="button"
                variant="outline"
                className="admin-button-ghost mt-4"
                onClick={() => this.setState({ hasError: false, message: "" })}
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Tentar novamente
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default AdminModuleErrorBoundary;
