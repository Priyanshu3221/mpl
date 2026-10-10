import { useEffect, useMemo, useState } from "react";
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Filter,
  Info,
  RotateCcw,
  Search,
  Shield,
  UserCheck,
  UserCog,
  UserX,
  Users as UsersIcon,
  X,
} from "lucide-react";
import { getUsers, updateUserRole, updateUserStatus } from "@/services/usersApi";
import { type ManagedUser } from "@/services/mock/usersMock";
import { type Role, ROLES, ROLE_LABELS, roleLandingCopy, focusRing } from "@/constants/permissions";
import { useCurrentRole } from "@/contexts/AuthContext";

function RoleModal({
  user,
  onClose,
  onComplete,
}: {
  user: ManagedUser;
  onClose: () => void;
  onComplete: (updated: ManagedUser) => void;
}) {
  const currentRole = useCurrentRole();
  const [selectedRole, setSelectedRole] = useState<Role>(user.role);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const submit = async () => {
    setSaving(true);
    setError("");
    try {
      const updated = await updateUserRole(user.id, selectedRole, currentRole || "Admin");
      onComplete(updated);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update user role.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#071a2c]/60 p-4 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
    >
      <div className="w-full max-w-md rounded-lg border border-[#dce5ee] bg-white p-6 shadow-2xl">
        <div className="flex items-start justify-between border-b border-[#edf2f5] pb-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-[#b27b00]">
              RBAC Role Assignment
            </p>
            <h2 id="role-modal-title" className="mt-1 text-lg font-semibold text-[#102a43]">
              Update Role: {user.name}
            </h2>
          </div>
          <button
            onClick={onClose}
            className={`rounded-md p-1.5 text-[#71859a] hover:bg-[#f1f5f8] ${focusRing}`}
          >
            <X size={18} />
          </button>
        </div>

        <div className="mt-4 space-y-4">
          <p className="text-xs text-[#607387]">
            Select the official operational role for <strong className="text-[#102a43]">{user.email}</strong>. This updates permissions in the application shell.
          </p>

          <div className="space-y-2">
            {Object.values(ROLES).map((r) => (
              <label
                key={r}
                className={`flex items-start gap-3 rounded-md border p-3 cursor-pointer transition-all ${
                  selectedRole === r
                    ? "border-[#102a43] bg-[#eaf2f7]"
                    : "border-[#dce5ee] hover:bg-[#f8fafc]"
                }`}
              >
                <input
                  type="radio"
                  name="userRole"
                  value={r}
                  checked={selectedRole === r}
                  onChange={() => setSelectedRole(r)}
                  className="mt-0.5 text-[#102a43]"
                />
                <div>
                  <p className="text-xs font-bold text-[#102a43]">{ROLE_LABELS[r]}</p>
                  <p className="text-[11px] text-[#607387]">{roleLandingCopy[r]}</p>
                </div>
              </label>
            ))}
          </div>

          {error && <p className="text-xs font-semibold text-[#a34d4d]">{error}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-3 border-t border-[#edf2f5] pt-4">
          <button
            onClick={onClose}
            className={`rounded-md border border-[#dce5ee] px-4 py-2 text-xs font-semibold text-[#607387] ${focusRing}`}
          >
            Cancel
          </button>
          <button
            disabled={saving}
            onClick={submit}
            className={`rounded-md bg-[#102a43] px-4 py-2 text-xs font-semibold text-white hover:bg-[#193c59] disabled:opacity-60 ${focusRing}`}
          >
            {saving ? "Updating Role…" : "Save Role Assignment"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function UsersPage() {
  const currentRole = useCurrentRole();
  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [editingUser, setEditingUser] = useState<ManagedUser | null>(null);

  const loadData = () => {
    setLoading(true);
    setError(false);
    getUsers()
      .then(setUsers)
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  };

  useEffect(loadData, []);

  const handleToggleStatus = async (user: ManagedUser) => {
    const nextStatus = user.status === "Active" ? "Inactive" : "Active";
    try {
      const updated = await updateUserStatus(user.id, nextStatus, currentRole || "Admin");
      setUsers((curr) => curr.map((u) => (u.id === updated.id ? updated : u)));
    } catch {
      // Error handling
    }
  };

  const filteredUsers = useMemo(() => {
    return users.filter((u) => {
      const q = search.toLowerCase();
      const matchSearch =
        search === "" ||
        u.name.toLowerCase().includes(q) ||
        u.email.toLowerCase().includes(q) ||
        u.department.toLowerCase().includes(q) ||
        u.constituencyOrDistrict.toLowerCase().includes(q);
      const matchRole = roleFilter === "All" || u.role === roleFilter;
      return matchSearch && matchRole;
    });
  }, [users, search, roleFilter]);

  if (loading) {
    return (
      <div className="space-y-4" aria-label="Loading users">
        <div className="h-28 animate-pulse rounded-md bg-[#e4ebf1]" />
        <div className="h-96 animate-pulse rounded-md bg-[#e4ebf1]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-[#e7c9c9] bg-[#fff9f9] p-12 text-center">
        <AlertTriangle className="mx-auto text-[#a34d4d]" size={32} />
        <h2 className="mt-4 text-lg font-semibold text-[#7c3030]">User directory unavailable</h2>
        <p className="mt-2 text-sm text-[#8b5b5b]">Error reaching user management service.</p>
        <button
          onClick={loadData}
          className={`mt-5 rounded-md border border-[#a34d4d] px-4 py-2 text-sm font-semibold text-[#7c3030] ${focusRing}`}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.17em] text-[#b27b00]">
            <UsersIcon size={14} /> System Administration
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-[#102a43]">
            User & Role Management
          </h1>
          <p className="mt-1 text-sm text-[#607387]">
            Manage investigator accounts, assign role permissions, and review user status.
          </p>
        </div>
        <div className="rounded-md border border-[#dce5ee] bg-[#f8fafc] px-3.5 py-2 text-xs text-[#607387]">
          Clerk Identity Integration Active
        </div>
      </div>

      {/* Filter Bar */}
      <div className="rounded-md border border-[#dce5ee] bg-white p-4">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm font-semibold text-[#102a43]">
            <Filter size={16} /> Filter User Directory
          </div>
          <button
            onClick={() => {
              setSearch("");
              setRoleFilter("All");
            }}
            className={`flex items-center gap-1.5 text-xs font-semibold text-[#607387] hover:text-[#102a43] ${focusRing}`}
          >
            <RotateCcw size={13} /> Reset Filters
          </button>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-[#8aa0b2]" size={16} />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name, email, department, or location..."
              className="w-full rounded-md border border-[#dce5ee] py-2 pl-9 pr-3 text-sm text-[#152536] outline-none focus:border-[#277da1] focus:ring-2 focus:ring-[#277da1]/20"
            />
          </div>
          <div>
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="w-full rounded-md border border-[#dce5ee] px-3 py-2 text-sm text-[#152536] outline-none focus:border-[#277da1] focus:ring-2 focus:ring-[#277da1]/20"
            >
              <option value="All">All Roles</option>
              {Object.values(ROLES).map((r) => (
                <option key={r} value={r}>{ROLE_LABELS[r]}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* User Directory Table */}
      {filteredUsers.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[#b8c8d5] bg-white p-12 text-center">
          <UsersIcon className="mx-auto text-[#8aa0b2]" size={32} />
          <h2 className="mt-4 font-semibold text-[#102a43]">No users match criteria</h2>
          <p className="mt-1 text-sm text-[#607387]">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-[#dce5ee] bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead className="border-b border-[#dce5ee] bg-[#f8fafc]">
                <tr>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    User & Email
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    Assigned Role
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    Department & Jurisdiction
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    Status
                  </th>
                  <th className="px-4 py-3 text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    Last Active
                  </th>
                  <th className="px-4 py-3 text-right text-xs font-bold uppercase tracking-[0.1em] text-[#71859a]">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#edf2f5]">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-[#fbfcfd]">
                    <td className="px-4 py-4 text-xs">
                      <span className="font-bold text-[#102a43]">{user.name}</span>
                      <span className="mt-0.5 block text-[11px] text-[#71859a]">{user.email}</span>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <span className="inline-flex items-center gap-1 rounded-md bg-[#eaf2f7] px-2.5 py-1 font-bold text-[#277da1]">
                        <Shield size={12} /> {ROLE_LABELS[user.role] || user.role}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <span className="font-semibold text-[#152536]">{user.department}</span>
                      <span className="mt-0.5 block text-[11px] text-[#71859a]">
                        {user.constituencyOrDistrict}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs">
                      <span
                        className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 font-bold ${
                          user.status === "Active"
                            ? "bg-[#e7f6ee] text-[#277a57]"
                            : "bg-[#edf1f4] text-[#5b6d7d]"
                        }`}
                      >
                        {user.status}
                      </span>
                    </td>
                    <td className="px-4 py-4 text-xs text-[#71859a]">{user.lastLogin}</td>
                    <td className="px-4 py-4 text-right text-xs space-x-2">
                      <button
                        onClick={() => setEditingUser(user)}
                        className={`rounded-md bg-[#102a43] px-2.5 py-1.5 font-semibold text-white hover:bg-[#193c59] ${focusRing}`}
                      >
                        Change Role
                      </button>
                      <button
                        onClick={() => handleToggleStatus(user)}
                        className={`rounded-md border px-2.5 py-1.5 font-semibold transition-all ${
                          user.status === "Active"
                            ? "border-[#d9a7a7] text-[#8c3636] hover:bg-[#fff4f4]"
                            : "border-[#a3c4db] text-[#277da1] hover:bg-[#eaf2f7]"
                        } ${focusRing}`}
                      >
                        {user.status === "Active" ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Role Assignment Modal */}
      {editingUser && (
        <RoleModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onComplete={(updated) => {
            setUsers((curr) => curr.map((u) => (u.id === updated.id ? updated : u)));
            setEditingUser(null);
          }}
        />
      )}
    </div>
  );
}
