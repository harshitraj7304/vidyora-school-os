import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Mail, Phone, Shield, Calendar, Hash, User, Edit, Key, X, AlertCircle, Save, Lock, School, Camera, Loader2 } from "lucide-react";
import useAuth from "../hooks/useAuth";
import useTenant from "../hooks/useTenant";
import { supabase } from "../services/supabase";
import {
  updateUserProfile,
  updateUserPassword,
  updateUserEmail,
  getUserProfileById,
  uploadAvatar
} from "../modules/auth/services/authService";
import { checkDuplicateUserEmail } from "../modules/users/services/userService";
import {
  EntityAvatar,
  RoleBadge,
  StatusBadge,
  Input,
  Button,
  useToast,
} from "../components/ui";

function ProfileField({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-4 p-4 rounded-xl bg-slate-800/40 border border-slate-700/30">
      <div className="w-9 h-9 rounded-lg bg-slate-700/60 flex items-center justify-center shrink-0 mt-0.5">
        <Icon size={16} className="text-cyan-400" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider mb-1">{label}</p>
        <p className="text-sm font-medium text-white truncate">{value || <span className="text-slate-600 italic">Not set</span>}</p>
      </div>
    </div>
  );
}

const ProfileSkeleton = () => (
  <div className="max-w-2xl space-y-6 animate-pulse">
    {/* Header skeleton */}
    <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 flex items-center gap-6">
      <div className="w-20 h-20 rounded-2xl bg-slate-800" />
      <div className="flex-1 space-y-2.5">
        <div className="h-6 bg-slate-800 rounded w-48 animate-pulse" />
        <div className="h-4 bg-slate-800 rounded w-32 animate-pulse" />
        <div className="flex gap-2">
          <div className="h-5 bg-slate-800 rounded w-16" />
          <div className="h-5 bg-slate-800 rounded w-16" />
        </div>
      </div>
    </div>
    {/* Details skeleton */}
    <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
      <div className="h-4 bg-slate-800 rounded w-32 animate-pulse" />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <div key={n} className="h-16 bg-slate-805/40 rounded-xl border border-slate-800/30" />
        ))}
      </div>
    </div>
  </div>
);

function ProfilePage() {
  const { userId } = useParams();
  const { profile, loading: authLoading, refreshProfile } = useAuth();
  const { school: ownSchool } = useTenant();

  const isOwnProfile = !userId || userId === profile?.id;

  // Other User States
  const [otherUserProfile, setOtherUserProfile] = useState(null);
  const [otherUserSchool, setOtherUserSchool] = useState(null);
  const [loadingOther, setLoadingOther] = useState(false);
  const [errorOther, setErrorOther] = useState(null);
  const [isUnauthorized, setIsUnauthorized] = useState(false);

  // Mode states
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Form states
  const [formData, setFormData] = useState({ full_name: "", mobile: "" });
  const [passwordData, setPasswordData] = useState({ password: "", confirm_password: "" });
  const [emailForm, setEmailForm] = useState({ email: "" });

  // Error & Load states
  const [formErrors, setFormErrors] = useState({});
  const [passwordErrors, setPasswordErrors] = useState({});
  const [emailErrors, setEmailErrors] = useState({});
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState(null);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const { showToast } = useToast();

  // Fetch other user profile if applicable
  useEffect(() => {
    if (isOwnProfile) {
      setOtherUserProfile(null);
      setOtherUserSchool(null);
      setIsUnauthorized(false);
      setErrorOther(null);
      return;
    }

    async function loadOtherProfile() {
      setLoadingOther(true);
      setErrorOther(null);
      setIsUnauthorized(false);
      try {
        const data = await getUserProfileById(userId);
        if (!data) {
          setErrorOther("User profile not found.");
          return;
        }

        // Tenant Isolation Check
        const isSuperAdmin = profile?.role === "SUPER_ADMIN";
        const matchesSchool = data.school_id === profile?.school_id;
        if (!isSuperAdmin && !matchesSchool) {
          setIsUnauthorized(true);
          return;
        }

        setOtherUserProfile(data);

        if (data.school_id) {
          const { data: targetSchool, error: schoolErr } = await supabase
            .from("schools")
            .select("*")
            .eq("id", data.school_id)
            .single();

          if (!schoolErr && targetSchool) {
            setOtherUserSchool(targetSchool);
          }
        }
      } catch (err) {
        console.error("Error loading other profile:", err);
        setErrorOther(err.message || "Failed to load user profile.");
      } finally {
        setLoadingOther(false);
      }
    }

    if (profile && userId) {
      loadOtherProfile();
    }
  }, [userId, isOwnProfile, profile]);

  // Pre-fill form when profile loads
  useEffect(() => {
    const target = isOwnProfile ? profile : otherUserProfile;
    if (target) {
      setFormData({
        full_name: target.full_name || "",
        mobile: target.mobile || ""
      });
      setEmailForm({
        email: target.email || ""
      });
    }
  }, [profile, otherUserProfile, isOwnProfile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({ ...prev, [name]: value }));
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const handleEmailInputChange = (e) => {
    const { name, value } = e.target;
    setEmailForm((prev) => ({ ...prev, [name]: value.toLowerCase() }));
    if (emailErrors[name]) {
      setEmailErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  // Validations
  const validateProfileForm = () => {
    const errors = {};
    if (!formData.full_name?.trim()) {
      errors.full_name = "Full name is required";
    } else if (formData.full_name.trim().length < 3) {
      errors.full_name = "Name must be at least 3 characters";
    }

    if (formData.mobile?.trim()) {
      const phoneRegex = /^\+?[0-9\s\-()]{7,15}$/;
      if (!phoneRegex.test(formData.mobile.trim())) {
        errors.mobile = "Invalid mobile phone format";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePasswordForm = () => {
    const errors = {};
    if (!passwordData.password) {
      errors.password = "New password is required";
    } else if (passwordData.password.length < 6) {
      errors.password = "Password must be at least 6 characters";
    }

    if (passwordData.password !== passwordData.confirm_password) {
      errors.confirm_password = "Passwords do not match";
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateEmailForm = () => {
    const errors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailForm.email?.trim()) {
      errors.email = "Email address is required";
    } else if (!emailRegex.test(emailForm.email.trim())) {
      errors.email = "Invalid email format";
    } else if (emailForm.email.trim().toLowerCase() === profile?.email?.toLowerCase()) {
      errors.email = "Email is already set to this address";
    }

    setEmailErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Submits
  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    if (!validateProfileForm()) return;

    setActionLoading(true);
    setActionError(null);
    try {
      await updateUserProfile(profile.id, formData);
      await refreshProfile();
      setIsEditing(false);
      showToast("Profile details updated successfully!");
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Failed to update profile details.");
      showToast(err.message || "Failed to update profile.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    if (!validatePasswordForm()) return;

    setActionLoading(true);
    setActionError(null);
    try {
      await updateUserPassword(passwordData.password);
      setPasswordData({ password: "", confirm_password: "" });
      setIsChangingPassword(false);
      showToast("Password updated successfully!");
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Failed to update password credentials.");
      showToast(err.message || "Failed to change password.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    if (!validateEmailForm()) return;

    setActionLoading(true);
    setActionError(null);
    try {
      const newEmail = emailForm.email.trim().toLowerCase();

      // Duplicate Check
      const isDup = await checkDuplicateUserEmail(newEmail, profile.id);
      if (isDup) {
        setEmailErrors({ email: "Email is already registered by another account" });
        setActionLoading(false);
        return;
      }

      await updateUserEmail(profile.id, newEmail);
      await refreshProfile();
      showToast("Email update initiated! Please check your new inbox to verify.");
    } catch (err) {
      console.error(err);
      setActionError(err.message || "Failed to update email.");
      showToast(err.message || "Failed to update email.", "error");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast("Photo must be smaller than 2MB", "error");
      return;
    }

    if (!file.type.startsWith("image/")) {
      showToast("Only image files are allowed", "error");
      return;
    }

    setUploadingPhoto(true);
    try {
      await uploadAvatar(profile.id, file);
      await refreshProfile();
      showToast("Profile picture updated successfully!");
    } catch (err) {
      console.error(err);
      showToast(err.message || "Failed to upload photo.", "error");
    } finally {
      setUploadingPhoto(false);
    }
  };

  const displayProfile = isOwnProfile ? profile : otherUserProfile;
  const displaySchool = isOwnProfile ? ownSchool : otherUserSchool;
  const isLoading = authLoading || (loadingOther && !displayProfile);

  if (isLoading) {
    return <ProfileSkeleton />;
  }

  if (errorOther || !displayProfile) {
    return (
      <div className="max-w-2xl text-center py-12 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <AlertCircle className="mx-auto text-red-400" size={48} />
        <h2 className="text-xl font-bold text-white">Profile Not Found</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          {errorOther || "The requested user profile does not exist or has been deleted."}
        </p>
      </div>
    );
  }

  if (isUnauthorized) {
    return (
      <div className="max-w-2xl text-center py-12 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <Shield className="mx-auto text-amber-500" size={48} />
        <h2 className="text-xl font-bold text-white">Access Denied</h2>
        <p className="text-slate-400 text-sm max-w-md mx-auto">
          You do not have permission to view profiles outside of your assigned school tenant.
        </p>
      </div>
    );
  }

  const joinedDate = displayProfile.created_at
    ? new Date(displayProfile.created_at).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric"
      })
    : "—";

  return (
    <div className="max-w-2xl space-y-6">

      {/* ── Header Card ───────────────────────────────────────────── */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900 via-slate-900 to-slate-950 border border-slate-800/80 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/8 blur-[80px] rounded-full pointer-events-none" />
        <div className="relative z-10 flex flex-col sm:flex-row items-start sm:items-center gap-6">
          
          {/* Avatar Container with Hover Camera Icon for Logged-In User */}
          <div className="relative group shrink-0">
            <EntityAvatar name={displayProfile.full_name} imageUrl={displayProfile.profile_photo_url} size="lg" />
            {isOwnProfile && (
              <label className="absolute inset-0 flex items-center justify-center bg-black/60 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer border border-cyan-500/50">
                {uploadingPhoto ? (
                  <Loader2 size={20} className="text-cyan-400 animate-spin" />
                ) : (
                  <Camera size={20} className="text-cyan-400" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  disabled={uploadingPhoto}
                  className="hidden"
                />
              </label>
            )}
          </div>

          <div className="space-y-1.5 flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-white tracking-tight truncate">
                {displayProfile.full_name || "Unknown User"}
              </h1>
              {!isOwnProfile && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-850 text-slate-400 border border-slate-800 shrink-0">
                  View Only
                </span>
              )}
            </div>
            <p className="text-slate-400 text-sm truncate">{displayProfile.email}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <RoleBadge role={displayProfile.role} />
              <StatusBadge status={displayProfile.status} />
            </div>
          </div>

          {isOwnProfile && (
            <div className="flex gap-2 self-stretch sm:self-auto shrink-0 mt-4 sm:mt-0">
              <Button
                onClick={() => {
                  setIsEditing(!isEditing);
                  setIsChangingPassword(false);
                  setActionError(null);
                  setFormErrors({});
                }}
                variant="secondary"
                size="sm"
                icon={isEditing ? X : Edit}
                className="flex-1 sm:flex-initial"
              >
                {isEditing ? "Cancel" : "Edit Profile"}
              </Button>
              
              <Button
                onClick={() => {
                  setIsChangingPassword(!isChangingPassword);
                  setIsEditing(false);
                  setActionError(null);
                  setPasswordErrors({});
                  setEmailErrors({});
                }}
                variant="secondary"
                size="sm"
                icon={isChangingPassword ? X : Key}
                className="flex-1 sm:flex-initial"
              >
                {isChangingPassword ? "Cancel" : "Security"}
              </Button>
            </div>
          )}
        </div>
      </div>

      {/* ── Active Mode Area ──────────────────────────────────────── */}

      {actionError && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs flex items-center gap-2">
          <AlertCircle size={16} />
          <span>{actionError}</span>
        </div>
      )}

      {isEditing ? (
        // EDIT DETAILS FORM
        <div className="rounded-2xl bg-slate-900 border border-slate-800/80 p-6 shadow-2xl space-y-5">
          <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <User size={16} className="text-cyan-400" />
            Modify Profile Details
          </h2>

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <Input
              label="Full Name *"
              name="full_name"
              value={formData.full_name}
              onChange={handleInputChange}
              disabled={actionLoading}
              placeholder="Full Name"
              error={formErrors.full_name}
              required
            />
            <Input
              label="Mobile Phone"
              name="mobile"
              value={formData.mobile}
              onChange={handleInputChange}
              disabled={actionLoading}
              placeholder="e.g. +91 9988776655"
              error={formErrors.mobile}
            />

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/60">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsEditing(false)}
                disabled={actionLoading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                size="sm"
                loading={actionLoading}
                icon={Save}
              >
                Save Details
              </Button>
            </div>
          </form>
        </div>
      ) : isChangingPassword ? (
        // SECURITY & CREDENTIALS (CHANGE PASSWORD & CHANGE EMAIL)
        <div className="space-y-6">
          {/* PASSWORD RESET CARD */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800/80 p-6 shadow-2xl space-y-5">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Lock size={16} className="text-cyan-400" />
              Update Account Password
            </h2>

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                label="New Password *"
                type="password"
                name="password"
                value={passwordData.password}
                onChange={handlePasswordChange}
                disabled={actionLoading}
                placeholder="New Password (min 6 chars)"
                error={passwordErrors.password}
                required
              />
              <Input
                label="Confirm New Password *"
                type="password"
                name="confirm_password"
                value={passwordData.confirm_password}
                onChange={handlePasswordChange}
                disabled={actionLoading}
                placeholder="Confirm Password"
                error={passwordErrors.confirm_password}
                required
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/60">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChangingPassword(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={actionLoading}
                  icon={Lock}
                >
                  Update Password
                </Button>
              </div>
            </form>
          </div>

          {/* EMAIL UPDATE CARD */}
          <div className="rounded-2xl bg-slate-900 border border-slate-800/80 p-6 shadow-2xl space-y-5">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-2">
              <Mail size={16} className="text-cyan-400" />
              Update Account Email
            </h2>

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <Input
                label="Email Address *"
                type="email"
                name="email"
                value={emailForm.email}
                onChange={handleEmailInputChange}
                disabled={actionLoading}
                placeholder="New Email Address"
                error={emailErrors.email}
                required
              />

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800/60">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsChangingPassword(false)}
                  disabled={actionLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={actionLoading}
                  icon={Mail}
                >
                  Update Email
                </Button>
              </div>
            </form>
          </div>
        </div>
      ) : (
        // READ-ONLY VIEWS
        <>
          <div className="rounded-2xl bg-slate-900 border border-slate-800/60 p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Account Details</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ProfileField icon={User}     label="Full Name"   value={displayProfile.full_name} />
              <ProfileField icon={Mail}     label="Email"       value={displayProfile.email} />
              <ProfileField icon={Phone}    label="Mobile"      value={displayProfile.mobile} />
              <ProfileField icon={Hash}     label="User Code"   value={displayProfile.user_code} />
              <ProfileField icon={Shield}   label="Role"        value={displayProfile.role?.replace(/_/g, " ")} />
              <ProfileField icon={Calendar} label="Joined"      value={joinedDate} />
            </div>
          </div>

          <div className="rounded-2xl bg-slate-900 border border-slate-800/60 p-6 space-y-4 shadow-xl">
            <h2 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Assigned School</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <ProfileField icon={School} label="School Name" value={displaySchool ? displaySchool.school_name : "Platform Administration (Super)"} />
              <ProfileField icon={Hash}   label="School Code" value={displaySchool ? displaySchool.school_code : "SYSTEM"} />
            </div>
          </div>
        </>
      )}


    </div>
  );
}

export default ProfilePage;
