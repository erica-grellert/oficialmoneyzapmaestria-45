import React from "react";
import AdminWorkspacePanel from "./experience/AdminWorkspacePanel";
import type { AdminWorkspaceId } from "./experience/adminWorkspaces";

/**
 * Legacy tab shell kept as a thin adapter.
 * The editorial admin page now owns navigation and uses AdminWorkspacePanel.
 */
const AdminSectionTabs: React.FC<{
  workspaceId?: AdminWorkspaceId;
}> = ({ workspaceId = "branding" }) => {
  return <AdminWorkspacePanel workspaceId={workspaceId} />;
};

export default AdminSectionTabs;
