import { useState, useEffect, useMemo, useCallback } from "react";
import { Users, Mail, Phone, Plus, Eye, Edit, Shield, AlertCircle, Hash, School, Key } from "lucide-react";
import useAuth from "../../../hooks/useAuth";
import useTenant from "../../../hooks/useTenant";
import { getAllSchools } from "../../schools/services/schoolService";
import {
  getAllUsers,
  createUser,
  updateUser,
  checkDuplicateUserCode,
  checkDuplicateUserEmail,
  resetUserPassword
} from "../services/userService";
import {
  PageHeader,
  StatCard,
  SectionCard,
  TableToolbar,
  EmptyState,
  ErrorState,
  EntityAvatar,
  CodeChip,
  StatusBadge,
  RoleBadge,
  DataTable,
  Modal,
  Button,
  Input,
  useToast,
  SkeletonTableRow,
} from "../../../components/ui";

const INITIAL_FORM_STATE = {
  full_name: "",
  user_code: "",
  email: "",
  mobile: "",
  role: "TEACHER",
  school_id: "",
  status: "ACTIVE"
};

const ROLE_COUNTS_CONFIG = [
  { key: "ALL",         label: "Total Users",   color: "text-cyan-400",    bg: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20" },
  { key: "SUPER_ADMIN", label: "Super Admins",  color: "text-violet-400",  bg: "from-violet-500/10 to-violet-500/5 border-violet-500/20" },
  { key: "SCHOOL_ADMIN",label: "School Admins", color: "text-cyan-400",    bg: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/10" },
  { key: "TEACHER",     label: "Teachers",      color: "text-blue-400",    bg: "from-blue-500/10 to-blue-500/5 border-blue-500/20" },
  { key: "STUDENT",     label: "Students",      color: "text-emerald-400", bg: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20" },
  { key: "PARENT",      label: "Parents",       color: "text-amber-400",   bg: "from-amber-500/10 to-amber-500/5 border-amber-500/20" },
];


function UsersPage() {
  const { profile } = useAuth();
  const { school } = useTenant();
  const [users, setUsers] = useState([]);
  const [schoolsList, setSchoolsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Resolves campus details dynamically since no FK join is defined in DB cache
  const getSchoolName = useCallback((user) => {
    if (!user?.school_id) return "Platform Administration (Super)";
    if (profile?.role === "SUPER_ADMIN") {
      return schoolsList.find((s) => s.id === user.school_id)?.school_name || "Assigned Campus";
    }
    return school?.school_name || "Active Campus";
  }, [profile, schoolsList, school]);

  // Modals Visibility
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Buffer state
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Local Toast States
  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);

  const { showToast } = useToast();

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Enforce tenant isolation based on profile role
      const tenantSchoolId = profile?.role !== "SUPER_ADMIN" ? profile?.school_id : null;
      const data = await getAllUsers(tenantSchoolId);
      setUsers(data);
    } catch (err) {
      console.error("Failed to fetch users:", err.message);
      setError(err.message || "Failed to load users.");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const fetchSchools = useCallback(async () => {
    try {
      const data = await getAllSchools();
      setSchoolsList(data);
    } catch (err) {
      console.error("Failed to fetch schools list:", err.message);
    }
  }, []);

  useEffect(() => {
    if (profile) {
      fetchUsers();
      if (profile.role === "SUPER_ADMIN") {
        fetchSchools();
      }
    }
  }, [profile, fetchUsers, fetchSchools]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };

  // Filter across name, email, code
  const filteredUsers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return users;
    return users.filter((u) =>
      u.full_name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.user_code?.toLowerCase().includes(q) ||
      u.mobile?.includes(q)
    );
  }, [users, search]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const paginatedUsers = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredUsers.slice(startIndex, startIndex + pageSize);
  }, [filteredUsers, currentPage, pageSize]);

  // Stats calculation
  const roleCounts = useMemo(() => {
    const counts = { ALL: users.length };
    users.forEach((u) => {
      counts[u.role] = (counts[u.role] || 0) + 1;
    });
    return counts;
  }, [users]);

  // Input Handling
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === "user_code") {
      finalValue = value.toUpperCase();
    } else if (name === "email") {
      finalValue = value.toLowerCase();
    }
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validations
  const validateForm = () => {
    const errors = {};
    if (!formData.full_name?.trim()) {
      errors.full_name = "Full name is required";
    }

    const codeRegex = /^[A-Z0-9]{3,12}$/;
    if (!formData.user_code?.trim()) {
      errors.user_code = "User code is required";
    } else if (!codeRegex.test(formData.user_code.trim())) {
      errors.user_code = "Code must be 3-12 characters, uppercase alphanumeric only";
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email?.trim()) {
      errors.email = "Email address is required";
    } else if (!emailRegex.test(formData.email.trim())) {
      errors.email = "Invalid email format";
    }

    if (formData.mobile?.trim()) {
      const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
      if (!phoneRegex.test(formData.mobile.trim())) {
        errors.mobile = "Invalid mobile format";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Modals Toggles Open
  const handleOpenAdd = useCallback(() => {
    setFormData({
      ...INITIAL_FORM_STATE,
      // Pre-fill school_id if School Admin
      school_id: profile?.role !== "SUPER_ADMIN" ? profile?.school_id || "" : ""
    });
    setFormErrors({});
    setActionError(null);
    setIsAddOpen(true);
  }, [profile]);

  const handleOpenEdit = useCallback((user) => {
    setSelectedUser(user);
    setFormData({
      full_name: user.full_name || "",
      user_code: user.user_code || "",
      email: user.email || "",
      mobile: user.mobile || "",
      role: user.role || "TEACHER",
      school_id: user.school_id || "",
      status: user.status || "ACTIVE"
    });
    setFormErrors({});
    setActionError(null);
    setIsEditOpen(true);
  }, []);

  const handleOpenDetails = useCallback((user) => {
    setSelectedUser(user);
    setIsDetailsOpen(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("add") === "true") {
      handleOpenAdd();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [handleOpenAdd]);

  // Submits
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const emailLower = formData.email.trim().toLowerCase();
      const codeUpper = formData.user_code.trim().toUpperCase();

      // Async checks
      const isDupCode = await checkDuplicateUserCode(codeUpper);
      if (isDupCode) {
        setFormErrors((prev) => ({ ...prev, user_code: "User code already in use" }));
        setActionLoading(false);
        return;
      }

      const isDupEmail = await checkDuplicateUserEmail(emailLower);
      if (isDupEmail) {
        setFormErrors((prev) => ({ ...prev, email: "Email address already registered" }));
        setActionLoading(false);
        return;
      }

      await createUser({
        ...formData,
        email: emailLower,
        user_code: codeUpper,
        school_id: profile?.role !== "SUPER_ADMIN" ? profile?.school_id : (formData.school_id || null)
      });

      // Update local state and trigger refresh
      await fetchUsers();
      setIsAddOpen(false);
      showToast("User onboarded successfully!");
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Failed to register user credentials in Auth.");
      showToast(err.message || "Failed to register user.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const emailLower = formData.email.trim().toLowerCase();
      const codeUpper = formData.user_code.trim().toUpperCase();

      const isDupCode = await checkDuplicateUserCode(codeUpper, selectedUser.id);
      if (isDupCode) {
        setFormErrors((prev) => ({ ...prev, user_code: "User code already in use" }));
        setActionLoading(false);
        return;
      }

      const isDupEmail = await checkDuplicateUserEmail(emailLower, selectedUser.id);
      if (isDupEmail) {
        setFormErrors((prev) => ({ ...prev, email: "Email address already registered" }));
        setActionLoading(false);
        return;
      }

      await updateUser(selectedUser.id, {
        ...formData,
        email: emailLower,
        user_code: codeUpper,
        school_id: profile?.role !== "SUPER_ADMIN" ? profile?.school_id : (formData.school_id || null)
      });

      // Update list
      await fetchUsers();
      setIsEditOpen(false);
      showToast("User profile updated successfully!");
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Failed to update profile.");
      showToast(err.message || "Failed to update profile.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = useCallback(async (user) => {
    const currentStatus = user.status?.toUpperCase() || "ACTIVE";
    let nextStatus = "ACTIVE";
    if (currentStatus === "ACTIVE") nextStatus = "INACTIVE";
    else if (currentStatus === "INACTIVE") nextStatus = "SUSPENDED";

    try {
      await updateUser(user.id, { ...user, status: nextStatus });
      await fetchUsers();
      showToast(`User status set to ${nextStatus}.`);
    } catch (err) {
      console.error(err);
      showToast("Failed to toggle user status.", "error");
    }
  }, [fetchUsers, showToast]);

  const handleResetPassword = useCallback(async (user) => {
    if (!window.confirm(`Send password reset email to ${user.full_name} (${user.email})?`)) {
      return;
    }
    try {
      await resetUserPassword(user.email);
      showToast(`Password reset link sent to ${user.email}.`);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to send password reset email.", "error");
    }
  }, [showToast]);

  // Columns definition
  const columns = useMemo(() => [
    {
      key: "user",
      header: "User",
      render: (u) => (
        <div className="flex items-center gap-3">
          <EntityAvatar name={u.full_name} size="md" />
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{u.full_name || "â€”"}</p>
            <p className="text-xs text-slate-500 truncate">{u.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "user_code",
      header: "Code",
      render: (u) => <CodeChip value={u.user_code} />,
    },
    {
      key: "mobile",
      header: "Mobile",
      className: "hidden md:table-cell",
      render: (u) => <span className="text-slate-400">{u.mobile || "â€”"}</span>,
    },
    {
      key: "role",
      header: "Role",
      render: (u) => <RoleBadge role={u.role} />,
    },
    {
      key: "status",
      header: "Status",
      render: (u) => <StatusBadge status={u.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (u) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleOpenDetails(u)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="View Profile Details"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => handleOpenEdit(u)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
            title="Edit User Profile"
          >
            <Edit size={15} />
          </button>
          <button
            onClick={() => handleToggleStatus(u)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-amber-400 hover:bg-amber-500/10 transition-colors cursor-pointer"
            title="Cycle User Status"
          >
            <Shield size={15} />
          </button>
          <button
            onClick={() => handleResetPassword(u)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-pointer"
            title="Send Password Reset Email"
          >
            <Key size={15} />
          </button>
        </div>
      ),
    },
  ], [handleOpenDetails, handleOpenEdit, handleToggleStatus, handleResetPassword]);

  // Toolbar Actions Trigger
  const AddButton = (
    <Button
      variant="primary"
      size="sm"
      onClick={handleOpenAdd}
      icon={Plus}
    >
      Add User
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Users Management"
        subtitle="Manage secure account credentials, roles, and profiles."
      />

      {/* Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {ROLE_COUNTS_CONFIG.map(({ key, label, color, bg }) => (
          <StatCard
            key={key}
            label={label}
            value={roleCounts[key] ?? 0}
            color={color}
            bg={bg}
            loading={loading}
          />
        ))}
      </div>

      {/* Table Card */}
      <SectionCard>
        {/* Toolbar */}
        <TableToolbar
          icon={Users}
          count={filteredUsers.length}
          noun="user"
          loading={loading}
          search={search}
          onSearch={handleSearchChange}
          searchPlaceholder="Search name, email, code..."
          actions={users.length > 0 ? AddButton : null}
        />

        {/* Content Area */}
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-slate-900/10">
                  <th className="text-left py-3.5 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">User</th>
                  <th className="text-left py-3.5 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Code</th>
                  <th className="text-left py-3.5 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest hidden md:table-cell">Mobile</th>
                  <th className="text-left py-3.5 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Role</th>
                  <th className="text-left py-3.5 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="text-right py-3.5 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                <SkeletonTableRow columns={6} />
                <SkeletonTableRow columns={6} />
                <SkeletonTableRow columns={6} />
              </tbody>
            </table>
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchUsers} />
        ) : users.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users onboarded yet"
            subtitle="Begin by adding credentials for teachers, students, or administrators."
          >
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenAdd}
              icon={Plus}
            >
              Onboard First User
            </Button>
          </EmptyState>
        ) : filteredUsers.length === 0 ? (
          <EmptyState
            icon={Users}
            title="No users found"
            subtitle="Try adjusting your search filters."
          />
        ) : (
          <>
            <DataTable columns={columns} data={paginatedUsers} />
            
            {/* Pagination controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/[0.08] p-5 mt-2">
                <span className="text-xs text-slate-500">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredUsers.length)} of {filteredUsers.length} users
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((prev) => prev - 1)}
                  >
                    Previous
                  </Button>
                  <span className="text-xs text-slate-400 font-semibold px-2">
                    Page {currentPage} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((prev) => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </SectionCard>

      {/* ———————————————————————————————————————————— */}

      {/* Add User Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Onboard User Account"
        subtitle="Creates secure Auth credentials and links details."
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsAddOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" form="add-user-form" loading={actionLoading}>Create Account</Button>
          </>
        }
      >
        <form id="add-user-form" onSubmit={handleCreateSubmit} className="space-y-4">
          {actionError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2"><AlertCircle size={14}/><span>{actionError}</span></div>}
          <Input label="Full Name" name="full_name" value={formData.full_name} onChange={handleInputChange} placeholder="e.g. John Doe" error={formErrors.full_name} disabled={actionLoading} required />
          <Input label="User Code" name="user_code" value={formData.user_code} onChange={handleInputChange} placeholder="e.g. TCH01" error={formErrors.user_code} disabled={actionLoading} className="uppercase" required />
          <Input label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="user@school.com" error={formErrors.email} disabled={actionLoading} required />
          <Input label="Mobile" name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="+91..." error={formErrors.mobile} disabled={actionLoading} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Role</label>
              <select name="role" value={formData.role} onChange={handleInputChange} disabled={actionLoading} className="input-base cursor-pointer">
                <option value="TEACHER">Teacher</option>
                <option value="STUDENT">Student</option>
                <option value="PARENT">Parent</option>
                <option value="SCHOOL_ADMIN">School Admin</option>
                {profile?.role === "SUPER_ADMIN" && <option value="SUPER_ADMIN">Super Admin</option>}
              </select>
            </div>
            {profile?.role === "SUPER_ADMIN" && (
              <div className="space-y-1.5">
                <label className="block text-sm font-medium text-slate-300">School</label>
                <select name="school_id" value={formData.school_id} onChange={handleInputChange} disabled={actionLoading} className="input-base cursor-pointer">
                  <option value="">Platform Admin</option>
                  {schoolsList.map((s) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
                </select>
                {formErrors.school_id && <p className="text-red-400 text-xs mt-1">{formErrors.school_id}</p>}
              </div>
            )}
          </div>
        </form>
      </Modal>

      {/* Edit User Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit User"
        subtitle={`Update details for ${selectedUser?.full_name || "this user"}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" form="edit-user-form" loading={actionLoading}>Save Changes</Button>
          </>
        }
      >
        <form id="edit-user-form" onSubmit={handleEditSubmit} className="space-y-4">
          {actionError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2"><AlertCircle size={14}/><span>{actionError}</span></div>}
          <Input label="Full Name" name="full_name" value={formData.full_name} onChange={handleInputChange} placeholder="Full Name" error={formErrors.full_name} disabled={actionLoading} required />
          <Input label="User Code" name="user_code" value={formData.user_code} onChange={handleInputChange} placeholder="User Code" error={formErrors.user_code} disabled={actionLoading} className="uppercase" required />
          <Input label="Mobile" name="mobile" value={formData.mobile} onChange={handleInputChange} placeholder="+91..." error={formErrors.mobile} disabled={actionLoading} />
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Role</label>
              <select name="role" value={formData.role} onChange={handleInputChange} disabled={actionLoading} className="input-base cursor-pointer">
                <option value="TEACHER">Teacher</option>
                <option value="STUDENT">Student</option>
                <option value="PARENT">Parent</option>
                <option value="SCHOOL_ADMIN">School Admin</option>
                {profile?.role === "SUPER_ADMIN" && <option value="SUPER_ADMIN">Super Admin</option>}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">Status</label>
              <select name="status" value={formData.status} onChange={handleInputChange} disabled={actionLoading} className="input-base cursor-pointer">
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
              </select>
            </div>
          </div>
        </form>
      </Modal>

      {/* View User Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedUser?.full_name}
        size="md"
        footer={<Button variant="secondary" size="sm" onClick={() => setIsDetailsOpen(false)}>Close</Button>}
      >
        {selectedUser && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-slate-800/60">
              <EntityAvatar name={selectedUser.full_name} size="lg" />
              <div className="min-w-0 space-y-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <RoleBadge role={selectedUser.role} />
                  <StatusBadge status={selectedUser.status} />
                </div>
                <p className="text-xs text-slate-500">{selectedUser.email}</p>
              </div>
            </div>
            {[
              { icon: Hash,   label: "User Code", value: selectedUser.user_code },
              { icon: Mail,   label: "Email",     value: selectedUser.email },
              { icon: Phone,  label: "Mobile",    value: selectedUser.mobile },
              { icon: School, label: "Campus",    value: getSchoolName(selectedUser) },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon size={15} className="text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
                  <p className="text-sm text-slate-300 mt-0.5">{value || "â€”"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

    </div>
  );
}

export default UsersPage;
