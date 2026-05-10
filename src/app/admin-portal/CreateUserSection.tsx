"use client";

import { useState, useEffect, useCallback } from "react";
import { toast, modal as confirmModal } from "@/lib/toast";
import Swal from "sweetalert2";

type CreatableRole = "teacher" | "editor";

interface StaffAccount {
  id: string;
  name: string;
  phone: string;
  role: "teacher" | "editor";
  createdAt: string;
}

type ModalState =
  | { mode: "create"; role: CreatableRole }
  | { mode: "edit"; account: StaffAccount }
  | null;

const roleStyles: Record<
  CreatableRole,
  { label: string; chip: string; ring: string; btn: string }
> = {
  teacher: {
    label: "Teacher",
    chip: "bg-emerald-100 text-emerald-700 border-emerald-200",
    ring: "focus:ring-emerald-500 focus:border-emerald-500",
    btn: "bg-emerald-600 hover:bg-emerald-700",
  },
  editor: {
    label: "Editor",
    chip: "bg-violet-100 text-violet-700 border-violet-200",
    ring: "focus:ring-violet-500 focus:border-violet-500",
    btn: "bg-violet-600 hover:bg-violet-700",
  },
};

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function CreateUserSection() {
  const [accounts, setAccounts] = useState<StaffAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalState, setModalState] = useState<ModalState>(null);

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/admin/users");
    if (res.ok) {
      setAccounts(await res.json());
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const teacherCount = accounts.filter((a) => a.role === "teacher").length;
  const editorCount = accounts.filter((a) => a.role === "editor").length;

  const handleDelete = async (account: StaffAccount) => {
    const result = await confirmModal.dangerConfirm(
      `Delete ${account.name}?`,
      `This will permanently delete this ${account.role} account. They will no longer be able to log in.`
    );
    if (!result.isConfirmed) return;

    const res = await fetch(`/api/admin/users/${account.id}`, {
      method: "DELETE",
    });
    if (res.ok) {
      toast.success("Account deleted", account.name);
      fetchAccounts();
    } else {
      const data = await res.json();
      toast.error("Delete failed", data.error || "Please try again");
    }
  };

  return (
    <>
      {/* Compact panel */}
      <div className="bg-white rounded-2xl border border-gray-200 mb-6 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-800">Staff Accounts</h2>
              <p className="text-xs text-slate-500">
                Create credentials and share with teachers or editors.
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={() => setModalState({ mode: "create", role: "teacher" })}
              className="bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold pl-4 pr-2 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Teacher</span>
              <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-md min-w-6 text-center">
                {teacherCount}
              </span>
            </button>
            <button
              onClick={() => setModalState({ mode: "create", role: "editor" })}
              className="bg-violet-600 hover:bg-violet-700 text-white text-sm font-semibold pl-4 pr-2 py-2 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Editor</span>
              <span className="bg-white/25 text-white text-xs font-bold px-2 py-0.5 rounded-md min-w-6 text-center">
                {editorCount}
              </span>
            </button>
          </div>
        </div>

        {/* Accounts list */}
        <div className="px-5 py-3">
          {loading ? (
            <div className="flex items-center justify-center py-6">
              <div className="w-6 h-6 border-2 border-amber-200 border-t-amber-600 rounded-full animate-spin" />
            </div>
          ) : accounts.length === 0 ? (
            <p className="text-center text-sm text-slate-500 py-6">
              No staff accounts yet. Click <strong>+ Teacher</strong> or{" "}
              <strong>+ Editor</strong> above to create one.
            </p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {accounts.map((a) => (
                <li
                  key={a.id}
                  className="py-2.5 flex items-center gap-3 group"
                >
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${
                      a.role === "teacher"
                        ? "bg-emerald-100 text-emerald-700"
                        : "bg-violet-100 text-violet-700"
                    }`}
                  >
                    {a.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-slate-800 truncate">
                      {a.name}
                    </p>
                    <p className="text-xs text-slate-500 font-mono">{a.phone}</p>
                  </div>
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${roleStyles[a.role].chip}`}
                  >
                    {a.role}
                  </span>
                  <span className="text-[11px] text-slate-400 hidden md:inline whitespace-nowrap">
                    {formatDate(a.createdAt)}
                  </span>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() =>
                        setModalState({ mode: "edit", account: a })
                      }
                      className="w-8 h-8 bg-gray-100 hover:bg-amber-100 rounded-lg flex items-center justify-center group/btn transition-colors"
                      title="Edit account"
                      aria-label={`Edit ${a.name}`}
                    >
                      <svg
                        className="w-4 h-4 text-gray-500 group-hover/btn:text-amber-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(a)}
                      className="w-8 h-8 bg-gray-100 hover:bg-red-100 rounded-lg flex items-center justify-center group/btn transition-colors"
                      title="Delete account"
                      aria-label={`Delete ${a.name}`}
                    >
                      <svg
                        className="w-4 h-4 text-gray-500 group-hover/btn:text-red-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Modal */}
      {modalState && (
        <StaffUserModal
          state={modalState}
          onClose={() => setModalState(null)}
          onSaved={fetchAccounts}
        />
      )}
    </>
  );
}

async function showCredentialsModal(args: {
  title: string;
  name: string;
  phone: string;
  password: string;
  roleLabel: string;
  confirmColor: string;
  isEdit: boolean;
}) {
  const { title, name, phone, password, roleLabel, confirmColor, isEdit } = args;
  const credentialsText = `Name: ${name}\nPhone: ${phone}\nPassword: ${password}\nRole: ${roleLabel.toUpperCase()}`;

  await Swal.fire({
    title,
    html: `
      <div class="text-left text-sm space-y-3 mt-2">
        <p class="text-slate-700">
          ${
            isEdit
              ? "New password is set. Save it now — once you close this dialog, it cannot be shown again."
              : "Save these credentials now and share them with the user. The password is hashed in the database and cannot be shown again."
          }
        </p>
        <div class="bg-slate-50 border border-slate-200 rounded-lg p-3 space-y-1.5 font-mono text-xs">
          <p><span class="text-slate-500">Name:</span> <span class="font-bold">${name}</span></p>
          <p><span class="text-slate-500">Phone:</span> <span class="font-bold">${phone}</span></p>
          <p><span class="text-slate-500">Password:</span> <span class="font-bold bg-amber-100 px-1.5 py-0.5 rounded">${password}</span></p>
          <p><span class="text-slate-500">Role:</span> <span class="font-bold uppercase">${roleLabel}</span></p>
        </div>
        <button id="staff-copy-creds-btn" type="button" class="w-full bg-slate-100 hover:bg-slate-200 border border-slate-300 text-slate-700 text-sm font-semibold py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <span>Copy all credentials</span>
        </button>
      </div>
    `,
    icon: "success",
    confirmButtonText: "Done — I've saved it",
    confirmButtonColor: confirmColor,
    didOpen: () => {
      const btn = document.getElementById("staff-copy-creds-btn") as HTMLButtonElement | null;
      if (!btn) return;
      const originalHTML = btn.innerHTML;
      btn.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(credentialsText);
          btn.innerHTML =
            '<svg class="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg><span class="text-emerald-700">Copied to clipboard!</span>';
          btn.classList.add("bg-emerald-50", "border-emerald-300");
          setTimeout(() => {
            btn.innerHTML = originalHTML;
            btn.classList.remove("bg-emerald-50", "border-emerald-300");
          }, 2000);
        } catch {
          btn.innerHTML =
            '<span class="text-red-600">Copy failed — please select & copy manually</span>';
        }
      });
    },
  });
}

function StaffUserModal({
  state,
  onClose,
  onSaved,
}: {
  state: NonNullable<ModalState>;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = state.mode === "edit";
  const role: CreatableRole = isEdit ? state.account.role : state.role;
  const styles = roleStyles[role];

  const [form, setForm] = useState({
    name: isEdit ? state.account.name : "",
    phone: isEdit ? state.account.phone : "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim() || !form.phone.trim()) {
      toast.warning("Missing fields", "Name and phone are required.");
      return;
    }

    if (isEdit) {
      // Password optional in edit mode — but if one is given, both must match
      if (form.password || form.confirmPassword) {
        if (form.password !== form.confirmPassword) {
          toast.warning("Password mismatch", "Passwords do not match.");
          return;
        }
        if (form.password.length < 5) {
          toast.warning("Weak password", "Password must be at least 5 characters.");
          return;
        }
      }
    } else {
      if (!form.password || !form.confirmPassword) {
        toast.warning("Missing fields", "Please fill all the fields.");
        return;
      }
      if (form.password !== form.confirmPassword) {
        toast.warning("Password mismatch", "Passwords do not match.");
        return;
      }
      if (form.password.length < 5) {
        toast.warning("Weak password", "Password must be at least 5 characters.");
        return;
      }
    }

    setSubmitting(true);

    try {
      const url = isEdit
        ? `/api/admin/users/${state.account.id}`
        : "/api/admin/users";
      const method = isEdit ? "PUT" : "POST";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? form : { ...form, role }),
      });
      const data = await res.json();
      setSubmitting(false);

      if (res.ok) {
        const showCredentials = !isEdit || !!form.password;
        if (showCredentials) {
          await showCredentialsModal({
            title: isEdit
              ? `${styles.label} password reset`
              : `${styles.label} account created!`,
            name: data.name,
            phone: data.phone,
            password: form.password,
            roleLabel: data.role,
            confirmColor: role === "teacher" ? "#059669" : "#7c3aed",
            isEdit,
          });
        } else {
          toast.success("Account updated", data.name);
        }
        onSaved();
        onClose();
      } else {
        if (res.status === 409) toast.error("Phone already used", data.error);
        else if (res.status === 400) toast.warning("Invalid input", data.error);
        else toast.error("Failed", data.error || "Please try again");
      }
    } catch {
      setSubmitting(false);
      toast.error("Network error", "Please check your connection.");
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className={`px-6 py-4 text-white ${
            role === "teacher"
              ? "bg-gradient-to-r from-emerald-500 to-teal-600"
              : "bg-gradient-to-r from-violet-500 to-fuchsia-600"
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-bold">
                {isEdit ? "Edit" : "Create"} {styles.label} Account
              </h2>
              <p className="text-white/85 text-xs mt-0.5">
                {isEdit
                  ? "Update name, phone, or set a new password (leave blank to keep current)."
                  : "Fill in the details and share with the user."}
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 bg-white/15 hover:bg-white/30 rounded-lg flex items-center justify-center"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="p-6 space-y-4"
          autoComplete="off"
        >
          {/* Hidden dummy fields to confuse browser autofill */}
          <input type="text" name="prevent_autofill" autoComplete="off" className="hidden" />
          <input type="password" name="prevent_autofill_pwd" autoComplete="new-password" className="hidden" />

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Full Name
            </label>
            <input
              type="text"
              required
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm focus:ring-2 outline-none ${styles.ring}`}
              placeholder="e.g., Md. Abdul Karim"
              autoComplete="off"
              name="staff-name-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 text-sm font-mono focus:ring-2 outline-none ${styles.ring}`}
              placeholder="e.g., 01XXXXXXXXX"
              autoComplete="off"
              name="staff-phone-field"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              {isEdit ? "New Password (optional)" : "Password"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                required={!isEdit}
                minLength={isEdit && !form.password ? undefined : 5}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className={`w-full border border-gray-300 rounded-lg px-3 py-2.5 pr-10 text-sm focus:ring-2 outline-none ${styles.ring}`}
                placeholder={
                  isEdit
                    ? "Leave blank to keep current password"
                    : "e.g., min 5 characters"
                }
                autoComplete="new-password"
                name="staff-password-field"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                tabIndex={-1}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1">
              Confirm Password
            </label>
            <input
              type={showPassword ? "text" : "password"}
              required={!isEdit || !!form.password}
              value={form.confirmPassword}
              onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
              className={`w-full border rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 ${
                form.confirmPassword && form.password !== form.confirmPassword
                  ? "border-red-400 focus:ring-red-500 focus:border-red-500"
                  : `border-gray-300 ${styles.ring}`
              }`}
              placeholder={
                isEdit
                  ? "Only needed if changing password"
                  : "e.g., re-enter the same password"
              }
              autoComplete="new-password"
              name="staff-confirm-password-field"
            />
            {form.confirmPassword && form.password !== form.confirmPassword && (
              <p className="text-[11px] text-red-500 mt-1">Passwords do not match</p>
            )}
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`flex-1 ${styles.btn} disabled:opacity-60 text-white font-semibold py-2.5 rounded-lg transition-colors shadow-sm flex items-center justify-center gap-2`}
            >
              {submitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  {isEdit ? "Saving..." : "Creating..."}
                </>
              ) : isEdit ? (
                "Save Changes"
              ) : (
                `Create ${styles.label}`
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
