export default function handler(req, res) {
  const authHeader = req.headers.authorization || req.headers.Authorization;

  res.setHeader("Content-Type", "application/json");
  res.status(200).json({
    userId: authHeader ? "usr_live_session" : null,
    email: authHeader ? "user@mplads.gov.in" : null,
    role: authHeader ? "Admin" : "Citizen",
    permissions: [
      "VIEW_DASHBOARD",
      "VIEW_PROJECTS",
      "CREATE_PROJECT",
      "EDIT_PROJECT",
      "SUBMIT_PROJECT",
      "REVIEW_PROJECT",
      "APPROVE_PROJECT",
      "REJECT_PROJECT",
      "VIEW_REPORTS",
      "EXPORT_REPORTS",
      "VIEW_FLAGS",
      "REVIEW_FLAGS",
      "MANAGE_USERS",
      "VIEW_AUDIT"
    ],
    bootstrap: false
  });
}
