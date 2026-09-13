import { Switch, Route, Redirect } from "wouter";
import { ProtectedRoute, RoleProtectedRoute } from "@/contexts/AuthContext";
import AppShell from "@/layouts/AppShell";
import { PERMISSIONS } from "@/constants/permissions";
import { AccessDeniedPage, AuthPage, LandingPage, NotFoundPage, RouteStub } from "@/pages/PhasePages";
import DashboardPage from "@/pages/DashboardPage";
import FlagsPage from "@/pages/FlagsPage";
import CollusionPage from "@/pages/CollusionPage";
import ProjectsPage from "@/pages/ProjectsPage";
import ProjectCreatePage from "@/pages/ProjectCreatePage";
import ProjectDetailPage from "@/pages/ProjectDetailPage";
import ProjectTrackingPage from "@/pages/ProjectTrackingPage";
import ReportsPage from "@/pages/ReportsPage";
import NotificationsPage from "@/pages/NotificationsPage";
import UsersPage from "@/pages/UsersPage";
import AuditPage from "@/pages/AuditPage";
import CompliancePage from "@/pages/CompliancePage";
import AccessibilityPage from "@/pages/AccessibilityPage";

const shell = (page: React.ReactNode, permission?: (typeof PERMISSIONS)[keyof typeof PERMISSIONS]) => (
  <ProtectedRoute>
    {permission ? (
      <RoleProtectedRoute permission={permission}>
        <AppShell>{page}</AppShell>
      </RoleProtectedRoute>
    ) : (
      <AppShell>{page}</AppShell>
    )}
  </ProtectedRoute>
);

export default function App() {
  return (
    <Switch>
      <Route path="/"><LandingPage /></Route>
      <Route path="/sign-in"><AuthPage mode="sign-in" /></Route>
      <Route path="/sign-up"><AuthPage mode="sign-up" /></Route>
      <Route path="/access-denied"><AccessDeniedPage /></Route>
      <Route path="/404"><NotFoundPage /></Route>
      <Route path="/dashboard">{shell(<DashboardPage />, PERMISSIONS.VIEW_DASHBOARD)}</Route>
      <Route path="/projects">{shell(<ProjectsPage />, PERMISSIONS.VIEW_PROJECTS)}</Route>
      <Route path="/projects/new">{shell(<ProjectCreatePage />, PERMISSIONS.CREATE_PROJECT)}</Route>
      <Route path="/projects/:id">{shell(<ProjectDetailPage />, PERMISSIONS.VIEW_PROJECTS)}</Route>
      <Route path="/projects/:id/edit">{shell(<RouteStub title="Edit project" />, PERMISSIONS.EDIT_PROJECT)}</Route>
      <Route path="/projects/:id/track">{shell(<ProjectTrackingPage />, PERMISSIONS.VIEW_PROJECTS)}</Route>
      <Route path="/flags">{shell(<FlagsPage />, PERMISSIONS.VIEW_FLAGS)}</Route>
      <Route path="/flags/collusion">{shell(<CollusionPage />, PERMISSIONS.REVIEW_FLAGS)}</Route>
      <Route path="/reports">{shell(<ReportsPage />, PERMISSIONS.VIEW_REPORTS)}</Route>
      <Route path="/notifications">{shell(<NotificationsPage />)}</Route>
      <Route path="/profile">{shell(<RouteStub title="Profile" />)}</Route>
      <Route path="/users">{shell(<UsersPage />, PERMISSIONS.MANAGE_USERS)}</Route>
      <Route path="/audit">{shell(<AuditPage />, PERMISSIONS.VIEW_AUDIT)}</Route>
      <Route path="/compliance">{shell(<CompliancePage />)}</Route>
      <Route path="/accessibility">{shell(<AccessibilityPage />)}</Route>
      <Route><Redirect to="/404" /></Route>
    </Switch>
  );
}
