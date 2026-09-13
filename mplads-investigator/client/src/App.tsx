import React, { lazy, Suspense } from "react";
import { Switch, Route, Redirect } from "wouter";
import { ProtectedRoute, RoleProtectedRoute } from "@/contexts/AuthContext";
import AppShell from "@/layouts/AppShell";
import { PERMISSIONS } from "@/constants/permissions";

const LandingPage = lazy(() => import("@/pages/PhasePages").then((m) => ({ default: m.LandingPage })));
const AuthPage = lazy(() => import("@/pages/PhasePages").then((m) => ({ default: m.AuthPage })));
const AccessDeniedPage = lazy(() => import("@/pages/PhasePages").then((m) => ({ default: m.AccessDeniedPage })));
const NotFoundPage = lazy(() => import("@/pages/PhasePages").then((m) => ({ default: m.NotFoundPage })));
const RouteStub = lazy(() => import("@/pages/PhasePages").then((m) => ({ default: m.RouteStub })));

const DashboardPage = lazy(() => import("@/pages/DashboardPage"));
const FlagsPage = lazy(() => import("@/pages/FlagsPage"));
const CollusionPage = lazy(() => import("@/pages/CollusionPage"));
const ProjectsPage = lazy(() => import("@/pages/ProjectsPage"));
const ProjectCreatePage = lazy(() => import("@/pages/ProjectCreatePage"));
const ProjectDetailPage = lazy(() => import("@/pages/ProjectDetailPage"));
const ProjectTrackingPage = lazy(() => import("@/pages/ProjectTrackingPage"));
const ReportsPage = lazy(() => import("@/pages/ReportsPage"));
const NotificationsPage = lazy(() => import("@/pages/NotificationsPage"));
const UsersPage = lazy(() => import("@/pages/UsersPage"));
const AuditPage = lazy(() => import("@/pages/AuditPage"));
const CompliancePage = lazy(() => import("@/pages/CompliancePage"));
const AccessibilityPage = lazy(() => import("@/pages/AccessibilityPage"));

function PageFallback() {
  return (
    <div className="flex min-h-[40vh] items-center justify-center p-6" aria-label="Loading page content">
      <div className="w-full max-w-md space-y-4">
        <div className="h-3 w-24 animate-pulse rounded bg-[#dce5ee]" />
        <div className="h-10 w-3/4 animate-pulse rounded bg-[#dce5ee]" />
        <div className="h-24 animate-pulse rounded bg-[#e9eff4]" />
      </div>
    </div>
  );
}

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
    <Suspense fallback={<PageFallback />}>
      <Switch>
        <Route path="/"><LandingPage /></Route>
        <Route path="/sign-in"><AuthPage mode="sign-in" /></Route>
        <Route path="/sign-in/:nest*"><AuthPage mode="sign-in" /></Route>
        <Route path="/sign-up"><AuthPage mode="sign-up" /></Route>
        <Route path="/sign-up/:nest*"><AuthPage mode="sign-up" /></Route>
        <Route path="/access-denied">{shell(<AccessDeniedPage />)}</Route>
        <Route path="/404">{shell(<NotFoundPage />)}</Route>
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
    </Suspense>
  );
}
