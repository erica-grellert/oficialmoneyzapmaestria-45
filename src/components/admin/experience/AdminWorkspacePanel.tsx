import React from "react";
import AdminModuleErrorBoundary from "./AdminModuleErrorBoundary";
import {
  getAdminWorkspace,
  type AdminWorkspaceId,
} from "./adminWorkspaces";

interface AdminWorkspacePanelProps {
  workspaceId: AdminWorkspaceId;
  children?: React.ReactNode;
}

const AdminWorkspacePanel: React.FC<AdminWorkspacePanelProps> = ({
  workspaceId,
  children,
}) => {
  const workspace = getAdminWorkspace(workspaceId);

  if (!workspace) {
    return (
      <div className="admin-surface p-6">
        <p className="text-sm text-[var(--admin-muted)]">
          Workspace não encontrado.
        </p>
      </div>
    );
  }

  if (children) {
    return <>{children}</>;
  }

  const Component = workspace.component;

  if (!Component) {
    return null;
  }

  return (
    <section className="space-y-5">
      <header className="admin-surface overflow-hidden p-6">
        <div className="flex items-start gap-4">
          <div className="rounded-2xl border border-[var(--admin-line)] bg-[var(--admin-gold-soft)] p-3">
            <workspace.icon className="h-5 w-5 text-[var(--admin-ink)]" />
          </div>
          <div>
            <p className="admin-kicker">Workspace</p>
            <h2 className="admin-display mt-2 text-3xl md:text-4xl">
              {workspace.label}
            </h2>
            <p className="mt-2 max-w-2xl text-sm text-[var(--admin-muted)] md:text-base">
              {workspace.description}
            </p>
          </div>
        </div>
      </header>

      <AdminModuleErrorBoundary title={workspace.label}>
        <div className="admin-surface overflow-hidden p-4 md:p-6 [&_.shadow-sm]:shadow-none">
          <Component />
        </div>
      </AdminModuleErrorBoundary>
    </section>
  );
};

export default AdminWorkspacePanel;
