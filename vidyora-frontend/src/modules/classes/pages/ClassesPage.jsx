import { useState, useEffect, useMemo, useCallback } from "react";
import { Layers, School, Calendar, Plus, Eye, Edit, Trash2, AlertCircle } from "lucide-react";
import useAuth from "../../../hooks/useAuth";
import useTenant from "../../../hooks/useTenant";
import { getAllSchools } from "../../schools/services/schoolService";
import {
  getAllClasses,
  createClass,
  updateClass,
  deleteClass,
  checkDuplicateClassCode
} from "../services/classService";
import {
  PageHeader,
  StatCard,
  SectionCard,
  TableToolbar,
  DataTable,
  EntityAvatar,
  CodeChip,
  StatusBadge,
  EmptyState,
  ErrorState,
  Modal,
  Button,
  Input,
  useToast,
  SkeletonTableRow,
} from "../../../components/ui";

const INITIAL_FORM_STATE = {
  class_name: "",
  class_code: "",
  school_id: "",
  status: "active"
};

function ClassesPage() {
  const { profile } = useAuth();
  const { school } = useTenant();
  const [classes, setClasses] = useState([]);
  const [schoolsList, setSchoolsList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");

  // Modals Visibility
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Form & Action states
  const [selectedClass, setSelectedClass] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [formErrors, setFormErrors] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize] = useState(5);

  const { showToast } = useToast();

  const fetchClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tenantSchoolId = profile?.role !== "SUPER_ADMIN" ? profile?.school_id : null;
      const data = await getAllClasses(tenantSchoolId);
      setClasses(data);
    } catch (err) {
      console.error("Failed to fetch classes:", err.message);
      setError(err.message || "Failed to load classes.");
    } finally {
      setLoading(false);
    }
  }, [profile]);

  const fetchSchools = useCallback(async () => {
    try {
      const data = await getAllSchools();
      setSchoolsList(data);
    } catch (err) {
      console.error("Failed to fetch schools:", err.message);
    }
  }, []);

  useEffect(() => {
    if (profile) {
      fetchClasses();
      if (profile.role === "SUPER_ADMIN") {
        fetchSchools();
      }
    }
  }, [profile, fetchClasses, fetchSchools]);

  const getSchoolName = useCallback((cls) => {
    if (profile?.role === "SUPER_ADMIN") {
      return schoolsList.find((s) => s.id === cls.school_id)?.school_name || cls.schools?.school_name || "Assigned Campus";
    }
    return school?.school_name || cls.schools?.school_name || "Active Campus";
  }, [profile, schoolsList, school]);

  const handleSearchChange = (val) => {
    setSearch(val);
    setCurrentPage(1);
  };

  // Search Filter
  const filteredClasses = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return classes;
    return classes.filter((cls) =>
      cls.class_name?.toLowerCase().includes(q) ||
      cls.class_code?.toLowerCase().includes(q) ||
      cls.schools?.school_name?.toLowerCase().includes(q) ||
      getSchoolName(cls)?.toLowerCase().includes(q)
    );
  }, [classes, search, getSchoolName]);

  // Pagination Slice
  const totalPages = Math.ceil(filteredClasses.length / pageSize);
  const paginatedClasses = useMemo(() => {
    const startIndex = (currentPage - 1) * pageSize;
    return filteredClasses.slice(startIndex, startIndex + pageSize);
  }, [filteredClasses, currentPage, pageSize]);

  // Input Change handler
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    let finalValue = value;
    if (name === "class_code") {
      finalValue = value.toUpperCase();
    }
    setFormData((prev) => ({ ...prev, [name]: finalValue }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Synchronous validations
  const validateForm = () => {
    const errors = {};
    if (!formData.class_name?.trim()) {
      errors.class_name = "Class name is required";
    }

    const codeRegex = /^[A-Z0-9-]{2,10}$/;
    if (!formData.class_code?.trim()) {
      errors.class_code = "Class code is required";
    } else if (!codeRegex.test(formData.class_code.trim())) {
      errors.class_code = "Code must be 2-10 characters, uppercase alphanumeric or dashes (e.g. G10-A)";
    }

    const currentSchoolId = profile?.role !== "SUPER_ADMIN" ? profile?.school_id : formData.school_id;
    if (!currentSchoolId) {
      errors.school_id = "School assignment is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Modal Open actions
  const handleOpenAdd = useCallback(() => {
    setFormData({
      ...INITIAL_FORM_STATE,
      school_id: profile?.role !== "SUPER_ADMIN" ? profile?.school_id || "" : ""
    });
    setFormErrors({});
    setActionError(null);
    setIsAddOpen(true);
  }, [profile]);

  const handleOpenEdit = useCallback((cls) => {
    setSelectedClass(cls);
    setFormData({
      class_name: cls.class_name || "",
      class_code: cls.class_code || "",
      school_id: cls.school_id || "",
      status: cls.status || "active"
    });
    setFormErrors({});
    setActionError(null);
    setIsEditOpen(true);
  }, []);

  const handleOpenDetails = useCallback((cls) => {
    setSelectedClass(cls);
    setIsDetailsOpen(true);
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("add") === "true") {
      handleOpenAdd();
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [handleOpenAdd]);

  // CRUD submits
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const codeUpper = formData.class_code.trim().toUpperCase();
      const currentSchoolId = profile?.role !== "SUPER_ADMIN" ? profile?.school_id : formData.school_id;

      // Async check
      const isDupCode = await checkDuplicateClassCode(codeUpper, currentSchoolId);
      if (isDupCode) {
        setFormErrors((prev) => ({ ...prev, class_code: "Class code already exists in this school" }));
        setActionLoading(false);
        return;
      }

      await createClass({
        ...formData,
        class_code: codeUpper,
        school_id: currentSchoolId
      });

      await fetchClasses();
      setIsAddOpen(false);
      showToast("Class created successfully!");
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Failed to create class.");
      showToast(err.message || "Failed to create class.", "error");
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
      const codeUpper = formData.class_code.trim().toUpperCase();
      const currentSchoolId = profile?.role !== "SUPER_ADMIN" ? profile?.school_id : formData.school_id;

      // Async check (excluding active id)
      const isDupCode = await checkDuplicateClassCode(codeUpper, currentSchoolId, selectedClass.id);
      if (isDupCode) {
        setFormErrors((prev) => ({ ...prev, class_code: "Class code already exists in this school" }));
        setActionLoading(false);
        return;
      }

      await updateClass(selectedClass.id, {
        ...formData,
        class_code: codeUpper,
        school_id: currentSchoolId
      });

      await fetchClasses();
      setIsEditOpen(false);
      showToast("Class updated successfully!");
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Failed to update class.");
      showToast(err.message || "Failed to update class.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleArchiveClass = useCallback(async (cls) => {
    if (!window.confirm(`Are you sure you want to archive "${cls.class_name}"? This is a soft-delete and cannot be undone.`)) {
      return;
    }
    try {
      await deleteClass(cls.id);
      await fetchClasses();
      showToast(`Class "${cls.class_name}" archived successfully.`);
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to archive class.", "error");
    }
  }, [fetchClasses, showToast]);

  // Derived: stats count
  const totalCount = classes.length;
  const activeCount = classes.filter((cls) => cls.status?.toLowerCase() === "active").length;
  const inactiveCount = classes.filter((cls) => cls.status?.toLowerCase() === "inactive").length;

  const STATS = [
    { label: "Total Classes", value: totalCount, color: "text-cyan-400", bg: "from-cyan-500/10 to-cyan-500/5 border-cyan-500/20" },
    { label: "Active Classes", value: activeCount, color: "text-emerald-400", bg: "from-emerald-500/10 to-emerald-500/5 border-emerald-500/20" },
    { label: "Inactive Classes", value: inactiveCount, color: "text-slate-400", bg: "from-slate-700/20 to-slate-700/10 border-slate-700/30" },
  ];

  // Columns definition
  const columns = useMemo(() => [
    {
      key: "class_name",
      header: "Class Name",
      render: (cls) => (
        <div className="flex items-center gap-3">
          <EntityAvatar name={cls.class_name} size="md" />
          <div className="min-w-0">
            <p className="font-semibold text-white truncate">{cls.class_name || "—"}</p>
          </div>
        </div>
      ),
    },
    {
      key: "class_code",
      header: "Class Code",
      render: (cls) => <CodeChip value={cls.class_code} />,
    },
    {
      key: "school",
      header: "School",
      className: "hidden md:table-cell",
      render: (cls) => (
        <div className="flex items-center gap-1.5 text-slate-400">
          <School size={13} className="text-slate-600 shrink-0" />
          <span className="truncate">{getSchoolName(cls)}</span>
        </div>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (cls) => <StatusBadge status={cls.status} />,
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      render: (cls) => (
        <div className="flex items-center justify-end gap-1">
          <button
            onClick={() => handleOpenDetails(cls)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            title="View Class Details"
          >
            <Eye size={15} />
          </button>
          <button
            onClick={() => handleOpenEdit(cls)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
            title="Edit Class"
          >
            <Edit size={15} />
          </button>
          <button
            onClick={() => handleArchiveClass(cls)}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
            title="Archive Class"
          >
            <Trash2 size={15} />
          </button>
        </div>
      ),
    },
  ], [getSchoolName, handleOpenDetails, handleOpenEdit, handleArchiveClass]);

  const AddButton = (
    <Button
      variant="primary"
      size="sm"
      onClick={handleOpenAdd}
      icon={Plus}
    >
      Add Class
    </Button>
  );

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <PageHeader
        title="Classes Management"
        subtitle="Manage academic classes and sections across the school systems."
      />

      {/* Stats Cards */}
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

      {/* Section Table Container */}
      <SectionCard>
        {/* Table Toolbar */}
        <TableToolbar
          icon={Layers}
          count={filteredClasses.length}
          noun="class"
          loading={loading}
          search={search}
          onSearch={handleSearchChange}
          searchPlaceholder="Search class name, code, school..."
          actions={classes.length > 0 ? AddButton : null}
        />

        {/* Dynamic content wrapper based on state */}
        {loading ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="border-b border-white/[0.08] bg-slate-900/10">
                  <th className="text-left py-3.5 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Class Name</th>
                  <th className="text-left py-3.5 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Class Code</th>
                  <th className="text-left py-3.5 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest hidden md:table-cell">School</th>
                  <th className="text-left py-3.5 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="text-right py-3.5 px-4 text-[10px] font-semibold text-slate-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody>
                <SkeletonTableRow columns={5} />
                <SkeletonTableRow columns={5} />
                <SkeletonTableRow columns={5} />
              </tbody>
            </table>
          </div>
        ) : error ? (
          <ErrorState message={error} onRetry={fetchClasses} />
        ) : classes.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No classes registered yet"
            subtitle="Begin by adding academic classes and configurations."
          >
            <Button
              variant="primary"
              size="md"
              onClick={handleOpenAdd}
              icon={Plus}
            >
              Register First Class
            </Button>
          </EmptyState>
        ) : filteredClasses.length === 0 ? (
          <EmptyState
            icon={Layers}
            title="No classes found"
            subtitle="Try adjusting your search filters."
          />
        ) : (
          <>
            <DataTable columns={columns} data={paginatedClasses} />

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex items-center justify-between border-t border-white/[0.08] p-5 mt-2">
                <span className="text-xs text-slate-500">
                  Showing {(currentPage - 1) * pageSize + 1} to {Math.min(currentPage * pageSize, filteredClasses.length)} of {filteredClasses.length} classes
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

      {/* ── Modal Dialogs ────────────────────────────────────────── */}

      {/* Add Class Modal */}
      <Modal
        isOpen={isAddOpen}
        onClose={() => setIsAddOpen(false)}
        title="Register Class Configuration"
        subtitle="Adds school class mappings and section tracking."
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsAddOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" form="add-class-form" loading={actionLoading}>Create Class</Button>
          </>
        }
      >
        <form id="add-class-form" onSubmit={handleCreateSubmit} className="space-y-4">
          {actionError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2"><AlertCircle size={14}/><span>{actionError}</span></div>}
          <Input label="Class Name" name="class_name" value={formData.class_name} onChange={handleInputChange} placeholder="e.g. Grade 10 - Section A" error={formErrors.class_name} disabled={actionLoading} required />
          <Input label="Class Code" name="class_code" value={formData.class_code} onChange={handleInputChange} placeholder="e.g. G10A" error={formErrors.class_code} disabled={actionLoading} className="uppercase" required />
          {profile?.role === "SUPER_ADMIN" && (
            <div className="space-y-1.5">
              <label className="block text-sm font-medium text-slate-300">School</label>
              <select name="school_id" value={formData.school_id} onChange={handleInputChange} disabled={actionLoading} className="input-base cursor-pointer">
                <option value="">Select school...</option>
                {schoolsList.map((s) => <option key={s.id} value={s.id}>{s.school_name}</option>)}
              </select>
              {formErrors.school_id && <p className="text-red-400 text-xs mt-1">{formErrors.school_id}</p>}
            </div>
          )}
        </form>
      </Modal>

      {/* Edit Class Modal */}
      <Modal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        title="Edit Class"
        subtitle={`Modify ${selectedClass?.class_name || "this class"}`}
        size="md"
        footer={
          <>
            <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(false)} disabled={actionLoading}>Cancel</Button>
            <Button variant="primary" size="sm" type="submit" form="edit-class-form" loading={actionLoading}>Save Changes</Button>
          </>
        }
      >
        <form id="edit-class-form" onSubmit={handleEditSubmit} className="space-y-4">
          {actionError && <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2"><AlertCircle size={14}/><span>{actionError}</span></div>}
          <Input label="Class Name" name="class_name" value={formData.class_name} onChange={handleInputChange} placeholder="Class Name" error={formErrors.class_name} disabled={actionLoading} required />
          <Input label="Class Code" name="class_code" value={formData.class_code} onChange={handleInputChange} placeholder="Class Code" error={formErrors.class_code} disabled={actionLoading} className="uppercase" required />
          <div className="space-y-1.5">
            <label className="block text-sm font-medium text-slate-300">Status</label>
            <select name="status" value={formData.status} onChange={handleInputChange} disabled={actionLoading} className="input-base cursor-pointer">
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </form>
      </Modal>

      {/* View Class Modal */}
      <Modal
        isOpen={isDetailsOpen}
        onClose={() => setIsDetailsOpen(false)}
        title={selectedClass?.class_name}
        size="sm"
        footer={<Button variant="secondary" size="sm" onClick={() => setIsDetailsOpen(false)}>Close</Button>}
      >
        {selectedClass && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-800/60">
              <EntityAvatar name={selectedClass.class_name} size="md" />
              <div className="flex items-center gap-2">
                <CodeChip value={selectedClass.class_code} />
                <StatusBadge status={selectedClass.status} />
              </div>
            </div>
            {[
              { icon: School,   label: "Campus",   value: selectedClass.school_name },
              { icon: Calendar, label: "Created",  value: selectedClass.created_at ? new Date(selectedClass.created_at).toLocaleDateString("en-IN") : null },
            ].map(({ icon: Icon, label, value }) => (
              <div key={label} className="flex items-start gap-3">
                <Icon size={15} className="text-slate-500 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">{label}</p>
                  <p className="text-sm text-slate-300 mt-0.5">{value || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </Modal>

    </div>
  );
}

export default ClassesPage;
