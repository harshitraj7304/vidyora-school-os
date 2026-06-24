import { useEffect, useState, useMemo, useCallback } from "react";
import { School, Mail, Phone, Plus, Eye, Edit, Trash2, Shield, AlertCircle, MapPin } from "lucide-react";
import { getAllSchools, createSchool, updateSchool, deleteSchool, checkDuplicateCode, checkDuplicateEmail } from "../services/schoolService";
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
  DataTable,
  Modal,
  Button,
  Input,
  useToast,
  SkeletonTableRow,
} from "../../../components/ui";

const INITIAL_FORM_STATE = {
  school_name: "",
  school_code: "",
  email: "",
  phone: "",
  address: "",
  status: "active"
};


function SchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Modal State Control
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Form & Action Tracking
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);

  const { showToast } = useToast();

  const fetchSchools = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getAllSchools();
      setSchools(data);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load schools.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchools();
  }, []);

  // Reset pagination index on search change
  const handleSearchChange = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };

  // Filter across name, code, email, phone
  const filteredSchools = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return schools;
    return schools.filter((s) =>
      s.school_name?.toLowerCase().includes(q) ||
      s.school_code?.toLowerCase().includes(q) ||
      s.email?.toLowerCase().includes(q) ||
      s.phone?.includes(q)
    );
  }, [schools, search]);

  // Derived: pagination bounds
  const totalPages = Math.ceil(filteredSchools.length / pageSize);
  const paginatedSchools = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredSchools.slice(startIndex, startIndex + pageSize);
  }, [filteredSchools, currentPage, pageSize]);

  // Derived: stats calculations
  const totalCount = schools.length;
  const activeCount = schools.filter((s) => s.status?.toLowerCase() === "active").length;
  const inactiveCount = schools.filter((s) => s.status?.toLowerCase() === "inactive").length;

  const STATS = [
    { label: "Total Schools", value: totalCount, color: "text-cyan-400", bg: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20" },
    { label: "Active Schools", value: activeCount, color: "text-emerald-400", bg: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20" },
    { label: "Inactive Schools", value: inactiveCount, color: "text-slate-400", bg: "from-slate-700/20 to-slate-700/10 border-slate-700/30" },
  ];

  // Forms Input Change
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Synchronous Validators
  const validateForm = () => {
    const errors = {};
    if (!formData.school_name?.trim()) {
      errors.school_name = "School name is required";
    }

    const codeRegex = /^[A-Z0-9]{3,10}$/;
    if (!formData.school_code?.trim()) {
      errors.school_code = "School code is required";
    } else if (!codeRegex.test(formData.school_code.trim())) {
      errors.school_code = "Code must be 3-10 characters, uppercase alphanumeric only";
    }

    if (formData.email?.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email.trim())) {
        errors.email = "Invalid email format";
      }
    }

    if (formData.phone?.trim()) {
      const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
      if (!phoneRegex.test(formData.phone.trim())) {
        errors.phone = "Invalid phone number format";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Modals Actions Open
  const handleOpenAdd = useCallback(() => {
    setFormData(INITIAL_FORM_STATE);
    setFormErrors({});
    setActionError(null);
    setIsAddOpen(true);
  }, []);

  const handleOpenEdit = useCallback((school) => {
    setSelectedSchool(school);
    setFormData({
      school_name: school.school_name || "",
      school_code: school.school_code || "",
      email: school.email || "",
      phone: school.phone || "",
      address: school.address || "",
      status: school.status || "active"
    });
    setFormErrors({});
    setActionError(null);
    setIsEditOpen(true);
  }, []);

  const handleOpenDetails = useCallback((school) => {
    setSelectedSchool(school);
    setIsDetailsOpen(true);
  }, []);

  const handleOpenDelete = useCallback((school) => {
    setSelectedSchool(school);
    setActionError(null);
    setIsDeleteOpen(true);
  }, []);

  // Submit Operations with Duplicate Validations
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const codeUpper = formData.school_code.trim().toUpperCase();
      
      // Asynchronous Duplicate checks
      const isDupCode = await checkDuplicateCode(codeUpper);
      if (isDupCode) {
        setFormErrors((prev) => ({ ...prev, school_code: "School code already registered" }));
        setActionLoading(false);
        return;
      }

      if (formData.email?.trim()) {
        const isDupEmail = await checkDuplicateEmail(formData.email);
        if (isDupEmail) {
          setFormErrors((prev) => ({ ...prev, email: "Email already in use" }));
          setActionLoading(false);
          return;
        }
      }

      const freshSchool = await createSchool({
        ...formData,
        school_code: codeUpper
      });
      setSchools((prev) => [freshSchool, ...prev]);
      setIsAddOpen(false);
      showToast("School registered successfully!");
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Failed to create school.");
      showToast(err.message || "Failed to create school.", "error");
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
      const codeUpper = formData.school_code.trim().toUpperCase();

      // Asynchronous Duplicate checks
      const isDupCode = await checkDuplicateCode(codeUpper, selectedSchool.id);
      if (isDupCode) {
        setFormErrors((prev) => ({ ...prev, school_code: "School code already registered" }));
        setActionLoading(false);
        return;
      }

      if (formData.email?.trim()) {
        const isDupEmail = await checkDuplicateEmail(formData.email, selectedSchool.id);
        if (isDupEmail) {
          setFormErrors((prev) => ({ ...prev, email: "Email already in use" }));
          setActionLoading(false);
          return;
        }
      }

      const updated = await updateSchool(selectedSchool.id, {
        ...formData,
        school_code: codeUpper
      });
      setSchools((prev) => prev.map((s) => (s.id === selectedSchool.id ? updated : s)));
      setIsEditOpen(false);
      showToast("School details updated successfully!");
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Failed to update school.");
      showToast(err.message || "Failed to update school.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleToggleStatus = useCallback(async (school) => {
    const nextStatus = school.status?.toLowerCase() === "active" ? "inactive" : "active";
    try {
      const updated = await updateSchool(school.id, { status: nextStatus });
      setSchools((prev) => prev.map((s) => (s.id === school.id ? updated : s)));
      showToast(`School status updated to ${nextStatus}.`);
    } catch (err) {
      console.error("Failed to toggle status:", err.message);
      showToast("Failed to update status: " + err.message, "error");
    }
  }, [showToast]);

  const handleDeleteSubmit = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      await deleteSchool(selectedSchool.id); // Triggers soft delete (archived)
      setSchools((prev) => prev.filter((s) => s.id !== selectedSchool.id));
      setIsDeleteOpen(false);
      showToast("School archived successfully!");
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Failed to delete school.");
      showToast(err.message || "Failed to delete school.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  // Table columns definition
  const columns = useMemo(() => [
    {
      key: "school",
      header: "School",
      render: (school) => (
        <div className="flex items-center gap-3">
          <EntityAvatar name={school.school_name} size="md" />
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{school.school_name || "â€”"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "school_code",
      header: "Code",
      render: (school) => <CodeChip value={school.school_code} />,
    },
    {
      key: "email",
      header: "Email",
      className: "hidden md:table-cell",
      render: (school) => (
        <div className="flex items-center gap-1.5 text-slate-400">
          <Mail size={13} className="text-slate-600 shrink-0" />
          <span className="truncate">{school.email || "â€”"}</span>
        </div>
      ),
    },
    {
      key: "phone",
      header: "Phone",
      className: "hidden lg:table-cell",
      render: (school) => (
        <div className="flex items-center gap-1.5 text-slate-400">
          <Phone size={13} className="text-slate-600 shrink-0" />
          <span>{school.phone || "â€”"}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (school) => <StatusBadge status={school.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (school) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleOpenDetails(school)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="View Details"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => handleOpenEdit(school)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
            title="Edit School"
          >
            <Edit size={15} />
          </button>
          <button
            onClick={() => handleToggleStatus(school)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              school.status?.toLowerCase() === "active"
                ? "text-slate-400 hover:text-amber-400 hover:bg-amber-500/10"
                : "text-amber-400 hover:text-emerald-400 hover:bg-emerald-500/10"
            }`}
            title={school.status?.toLowerCase() === "active" ? "Deactivate" : "Activate"}
          >
            <Shield size={15} />
          </button>
          <button
            onClick={() => handleOpenDelete(school)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Archive School"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ], [handleOpenDetails, handleOpenEdit, handleToggleStatus, handleOpenDelete]);

  // Toolbar Actions Trigger
  const AddButton = (
    <Button
      variant="primary"
      size="sm"
      onClick={handleOpenAdd}
      icon={Plus}
    >
      Add School
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Schools"
        subtitle="All registered schools on the Vidyora platform."
      />

      {/* Stats Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STATS.map(({ label, value, color, bg }) => (
          <StatCard
            key={label}
            label={label}
            value={value}
            color={color}
            bg={bg}
            loading={loading}
          />
        ))}
      </div>

      {/* Table Card */}
      <SectionCard>
        <TableToolbar
          icon={School}
          count={filteredSchools.length}
          noun="school"
          loading={loading}
          search={search}
          onSearch={handleSearchChange}
          searchPlaceholder="Search name, code, email..."
          actions={schools.length > 0 ? AddButton : null}
        />

        {/* Content */}
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-slate-900/10">
                  <th className="text-left py-3.5 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">School</th>
                  <th className="text-left py-3.5 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Code</th>
                  <th className="text-left py-3.5 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest hidden md:table-cell">Email</th>
                  <th className="text-left py-3.5 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest hidden lg:table-cell">Phone</th>
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
          <ErrorState message={error} onRetry={fetchSchools} />
        ) : schools.length === 0 ? (
          <EmptyState
            icon={School}
            title="No schools registered yet"
            subtitle="Start by onboarding your first school tenant."
          >
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenAdd}
              icon={Plus}
            >
              Onboard First School
            </Button>
          </EmptyState>
        ) : filteredSchools.length === 0 ? (
          <EmptyState
            icon={School}
            title="No schools found"
            subtitle="Try adjusting your search query."
          />
        ) : (
          <>
            <DataTable columns={columns} data={paginatedSchools} />
            
            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/[0.08] p-5 mt-2">
                <span className="text-xs text-slate-500">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredSchools.length)} of {filteredSchools.length} schools
                </span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="outline"
                    size="xs"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
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
                    onClick={() => setCurrentPage(prev => prev + 1)}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </SectionCard>

      {/* â”€â”€ Modal Dialogs â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}

      {/* 1. Add School Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register New School"
        subtitle="Create a tenant for campus-level user profiles."
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsAddOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" form="add-school-form" loading={actionLoading}>Register School</Button>
          </>
        }
      >
        <form id="add-school-form" onSubmit={handleCreateSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} /><span>{actionError}</span>
            </div>
          )}
          <Input label="School Name" name="school_name" value={formData.school_name} onChange={handleInputChange} placeholder="e.g. Greenwood Academy" error={formErrors.school_name} disabled={actionLoading} required />
          <Input label="School Code" name="school_code" value={formData.school_code} onChange={handleInputChange} placeholder="e.g. GA01 (3-10 uppercase alphanumeric)" error={formErrors.school_code} disabled={actionLoading} className="uppercase" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="contact@school.com" error={formErrors.email} disabled={actionLoading} />
            <Input label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="+91..." error={formErrors.phone} disabled={actionLoading} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Address</label>
            <textarea name="address" value={formData.address} onChange={handleInputChange} placeholder="School location details" disabled={actionLoading} rows={2} className="input-base resize-none" />
          </div>
        </form>
      </Modal>

      {/* 2. Edit School Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit School"
        subtitle={`Modify details for ${selectedSchool?.school_name || "this school"}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" form="edit-school-form" loading={actionLoading}>Save Changes</Button>
          </>
        }
      >
        <form id="edit-school-form" onSubmit={handleEditSubmit} className="space-y-4">
          {actionError && (
            <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle size={14} /><span>{actionError}</span>
            </div>
          )}
          <Input label="School Name" name="school_name" value={formData.school_name} onChange={handleInputChange} placeholder="School Name" error={formErrors.school_name} disabled={actionLoading} required />
          <Input label="School Code" name="school_code" value={formData.school_code} onChange={handleInputChange} placeholder="Alphanumeric code" error={formErrors.school_code} disabled={actionLoading} className="uppercase" required />
          <div className="grid grid-cols-2 gap-3">
            <Input label="Email" name="email" type="email" value={formData.email} onChange={handleInputChange} placeholder="Email" error={formErrors.email} disabled={actionLoading} />
            <Input label="Phone" name="phone" value={formData.phone} onChange={handleInputChange} placeholder="Phone" error={formErrors.phone} disabled={actionLoading} />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Address</label>
            <textarea name="address" value={formData.address} onChange={handleInputChange} disabled={actionLoading} rows={2} className="input-base resize-none" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange} disabled={actionLoading} className="input-base cursor-pointer">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* 3. View Details Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedSchool?.school_name}
        size="md"
        footer={<Button variant="secondary" size="sm" onClick={() => setIsDetailsOpen(false)}>Close</Button>}
      >
        {selectedSchool && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800/60">
              <EntityAvatar name={selectedSchool.school_name} size="lg" />
              <div className="flex items-center gap-2 flex-wrap">
                <CodeChip value={selectedSchool.school_code} />
                <StatusBadge status={selectedSchool.status} />
              </div>
            </div>
            {[
              { icon: Mail,   label: "Email",    value: selectedSchool.email },
              { icon: Phone,  label: "Phone",    value: selectedSchool.phone },
              { icon: MapPin, label: "Address",  value: selectedSchool.address },
              { icon: School, label: "Registered", value: selectedSchool.created_at ? new Date(selectedSchool.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }) : null },
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

      {/* 4. Delete Confirmation Modal */}
      <Modal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Archive School?"
        size="sm"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsDeleteOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button variant="danger" size="sm" onClick={handleDeleteSubmit} loading={actionLoading}>Confirm Archive</Button>
          </>
        }
      >
        <p className="text-slate-400 text-sm leading-relaxed">
          Are you sure you want to archive <strong className="text-white">{selectedSchool?.school_name}</strong>? This soft-deletes the school from active listings.
        </p>
        {actionError && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
            <AlertCircle size={14} /><span>{actionError}</span>
          </div>
        )}
      </Modal>

    </div>
  );
}

export default SchoolsPage;
