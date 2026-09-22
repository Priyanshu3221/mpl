import { useUser } from "@clerk/clerk-react";
import { BadgeCheck, Building2, Calendar, IdCard, Mail, ShieldCheck, UserRound } from "lucide-react";
import { useCurrentRole } from "@/contexts/AuthContext";
import { ROLE_LABELS, ROLE_PERMISSIONS, roleLandingCopy, securityCopy } from "@/constants/permissions";

function Skeleton() {
  return (
    <div className="max-w-3xl space-y-5" aria-label="Loading profile">
      <div className="h-32 animate-pulse rounded-lg bg-[#e4ebf1]" />
      <div className="h-64 animate-pulse rounded-lg bg-[#e4ebf1]" />
    </div>
  );
}

export default function ProfilePage() {
  const { user, isLoaded } = useUser();
  const role = useCurrentRole();

  if (!isLoaded) return <Skeleton />;

  const email = user?.primaryEmailAddress?.emailAddress || "—";
  const fullName = user?.fullName || user?.username || "Workspace User";
  const joined = user?.createdAt ? new Date(user.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : "—";
  const lastActive = user?.lastSignInAt ? new Date(user.lastSignInAt).toLocaleString("en-IN") : "—";
  const permissions = role ? ROLE_PERMISSIONS[role] : [];

  return (
    <div className="max-w-3xl space-y-6">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.17em] text-[#b27b00]">Account</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#102a43]">My Profile</h1>
        <p className="mt-2 text-sm text-[#607387]">Your identity, current role, and access within the MPLADS Investigator workspace.</p>
      </div>

      {/* Identity card */}
      <section className="rounded-lg border border-[#dce5ee] bg-white p-6 sm:p-7">
        <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
          {user?.imageUrl ? (
            <img src={user.imageUrl} alt="" className="h-16 w-16 rounded-full border border-[#dce5ee] object-cover" />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[#eaf2f7] text-[#102a43]">
              <UserRound size={28} />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="text-xl font-semibold text-[#102a43]">{fullName}</h2>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-[#607387]"><Mail size={14} /> {email}</p>
          </div>
          {role && (
            <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-md bg-[#eaf2f7] px-3 py-1.5 text-xs font-bold text-[#277da1]">
              <ShieldCheck size={14} /> {ROLE_LABELS[role]}
            </span>
          )}
        </div>
      </section>

      {/* Role & access */}
      <section className="rounded-lg border border-[#dce5ee] bg-white p-6 sm:p-7">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#102a43]">
          <BadgeCheck className="text-[#277da1]" size={18} /> Current role
        </div>
        <p className="mt-2 text-sm leading-6 text-[#607387]">{role ? roleLandingCopy[role] : "No role has been assigned to this account yet."}</p>

        {role && permissions.length > 0 && (
          <div className="mt-5">
            <p className="text-xs font-bold uppercase tracking-[0.12em] text-[#71859a]">Granted permissions</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {permissions.map((permission) => (
                <span key={permission} className="rounded-md border border-[#dce5ee] bg-[#f8fafc] px-2.5 py-1 text-[11px] font-semibold text-[#455b6e]">
                  {permission.replaceAll("_", " ").toLowerCase()}
                </span>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Account details */}
      <section className="rounded-lg border border-[#dce5ee] bg-white p-6 sm:p-7">
        <div className="flex items-center gap-2 text-sm font-semibold text-[#102a43]">
          <IdCard className="text-[#277da1]" size={18} /> Account details
        </div>
        <dl className="mt-4 grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs font-semibold text-[#71859a]">User ID</dt>
            <dd className="mt-1 truncate text-sm text-[#152536]">{user?.id || "—"}</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-semibold text-[#71859a]"><Building2 size={12} /> Workspace</dt>
            <dd className="mt-1 text-sm text-[#152536]">MPLADS Investigator & Monitoring System</dd>
          </div>
          <div>
            <dt className="flex items-center gap-1.5 text-xs font-semibold text-[#71859a]"><Calendar size={12} /> Member since</dt>
            <dd className="mt-1 text-sm text-[#152536]">{joined}</dd>
          </div>
          <div>
            <dt className="text-xs font-semibold text-[#71859a]">Last active</dt>
            <dd className="mt-1 text-sm text-[#152536]">{lastActive}</dd>
          </div>
        </dl>
      </section>

      <p className="rounded-md border border-[#e6edf2] bg-[#f8fafc] p-4 text-xs leading-5 text-[#607387]">{securityCopy}</p>
    </div>
  );
}
