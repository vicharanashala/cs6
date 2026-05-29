import { useState } from "react";
import { X, Lock, Mail, User as UserIcon, GraduationCap, Shield, ArrowRight, ArrowLeft, Check } from "lucide-react";
import api from "../api/axios";

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: ""
  });
  
  // Onboarding Wizard State
  const [onboardingStep, setOnboardingStep] = useState(0); // 0: auth, 1: role selection, 2: metadata form
  const [selectedRole, setSelectedRole] = useState(""); // "user" | "admin"
  const [onboardData, setOnboardData] = useState({
    fullName: "",
    college: "",
    major: "",
    semester: "Semester 1",
    interests: "",
    department: "",
    staffId: "",
    authTier: "Level 1"
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleOnboardChange = (e) => {
    setOnboardData({
      ...onboardData,
      [e.target.name]: e.target.value
    });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const endpoint = isLogin ? "/auth/login" : "/auth/register";
      const payload = isLogin 
        ? { email: formData.email, password: formData.password }
        : { username: formData.username, name: formData.name, email: formData.email, password: formData.password };

      const response = await api.post(endpoint, payload);
      
      if (response.data.success) {
        const { accessToken, user } = response.data.data;
        localStorage.setItem("token", accessToken);
        
        if (!isLogin) {
          // If registering, intercept and transition to onboarding wizard step 1
          setOnboardingStep(1);
          setOnboardData(prev => ({
            ...prev,
            fullName: user.name || formData.name || ""
          }));
        } else {
          // If normal login, login directly
          localStorage.setItem("user", JSON.stringify(user));
          onAuthSuccess(user);
          handleClose();
        }
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error?.message || "Authentication failed. Please check your credentials.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      let profileMetadata = {};
      if (selectedRole === "user") {
        profileMetadata = {
          fullName: onboardData.fullName,
          college: onboardData.college,
          major: onboardData.major,
          semester: onboardData.semester,
          interests: onboardData.interests
        };
      } else {
        profileMetadata = {
          fullName: onboardData.fullName,
          department: onboardData.department,
          staffId: onboardData.staffId,
          authTier: onboardData.authTier
        };
      }

      // API PATCH to update user role and profileMetadata
      const response = await api.patch("/users/me", {
        name: onboardData.fullName,
        role: selectedRole,
        profileMetadata
      });

      if (response.data.success) {
        const updatedUser = response.data.data;
        localStorage.setItem("user", JSON.stringify(updatedUser));
        onAuthSuccess(updatedUser);
        handleClose();
      }
    } catch (err) {
      console.error(err);
      const errMsg = err.response?.data?.error?.message || "Failed to save profile. Please check the fields and try again.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    // Reset wizard states
    setOnboardingStep(0);
    setSelectedRole("");
    setOnboardData({
      fullName: "",
      college: "",
      major: "",
      semester: "Semester 1",
      interests: "",
      department: "",
      staffId: "",
      authTier: "Level 1"
    });
    setFormData({ username: "", name: "", email: "", password: "" });
    setError("");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className={`relative w-full ${onboardingStep > 0 ? 'max-w-2xl' : 'max-w-md'} rounded-2xl border border-white/10 bg-surface-light p-8 shadow-2xl transition-all duration-300`}>
        
        {/* Close Button - hide during onboarding to force completion */}
        {onboardingStep === 0 && (
          <button 
            onClick={handleClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        )}

        {/* STEP 0: Login / Register Form */}
        {onboardingStep === 0 && (
          <>
            <div className="mb-6 text-center">
              <h3 className="text-2xl font-bold text-white">
                {isLogin ? "Welcome Back" : "Create Account"}
              </h3>
              <p className="mt-2 text-sm text-gray-400">
                {isLogin 
                  ? "Sign in to contribute questions and answer others."
                  : "Register to join the crowdsourced FAQ community."}
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 p-3 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {!isLogin && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                      Username
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute top-3 left-3 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        name="username"
                        value={formData.username}
                        onChange={handleChange}
                        required
                        placeholder="riyasharma"
                        className="w-full rounded-lg border border-white/10 bg-surface py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                      Full Name
                    </label>
                    <div className="relative">
                      <UserIcon className="absolute top-3 left-3 h-4 w-4 text-gray-500" />
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        placeholder="Riya Sharma"
                        className="w-full rounded-lg border border-white/10 bg-surface py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute top-3 left-3 h-4 w-4 text-gray-500" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    placeholder="riya@example.com"
                    className="w-full rounded-lg border border-white/10 bg-surface py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock className="absolute top-3 left-3 h-4 w-4 text-gray-500" />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder="••••••••"
                    className="w-full rounded-lg border border-white/10 bg-surface py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-lg bg-gradient-to-r from-primary-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 hover:brightness-110 active:scale-95 transition-all duration-300 disabled:opacity-50"
              >
                {loading ? "Processing..." : isLogin ? "Login" : "Sign Up"}
              </button>
            </form>

            <div className="mt-6 text-center text-xs text-gray-500">
              {isLogin ? (
                <p>
                  Don't have an account?{" "}
                  <button 
                    onClick={() => setIsLogin(false)} 
                    className="font-medium text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Sign up
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{" "}
                  <button 
                    onClick={() => setIsLogin(true)} 
                    className="font-medium text-primary-400 hover:text-primary-300 transition-colors"
                  >
                    Login
                  </button>
                </p>
              )}
            </div>
          </>
        )}

        {/* STEP 1: Onboarding Role Selection */}
        {onboardingStep === 1 && (
          <div className="flex flex-col items-center">
            <div className="mb-8 text-center max-w-md">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-300 border border-primary-500/20">
                Step 1 of 2: Role Selection
              </span>
              <h3 className="mt-3 text-2xl font-bold text-white">Choose Your Role</h3>
              <p className="mt-2 text-sm text-gray-400">
                Select the role that fits your goals. This determines your dashboard interface and community permissions.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full mb-8">
              {/* Student Card */}
              <button
                type="button"
                onClick={() => setSelectedRole("user")}
                className={`flex flex-col items-center text-center p-6 rounded-2xl border transition-all duration-300 ${
                  selectedRole === "user"
                    ? "border-primary-500 bg-primary-500/5 ring-2 ring-primary-500/30"
                    : "border-white/10 bg-surface hover:border-white/20 hover:bg-surface-lighter"
                }`}
              >
                <div className={`p-4 rounded-xl mb-4 transition-colors ${
                  selectedRole === "user" ? "bg-primary-500/20 text-primary-400" : "bg-white/5 text-gray-400"
                }`}>
                  <GraduationCap size={32} />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Student / Contributor</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Submit academic or campus-related inquiries, provide answers, vote on helpful content, and earn reputation points.
                </p>
              </button>

              {/* Admin Card */}
              <button
                type="button"
                onClick={() => setSelectedRole("admin")}
                className={`flex flex-col items-center text-center p-6 rounded-2xl border transition-all duration-300 ${
                  selectedRole === "admin"
                    ? "border-primary-500 bg-primary-500/5 ring-2 ring-primary-500/30"
                    : "border-white/10 bg-surface hover:border-white/20 hover:bg-surface-lighter"
                }`}
              >
                <div className={`p-4 rounded-xl mb-4 transition-colors ${
                  selectedRole === "admin" ? "bg-primary-500/20 text-primary-400" : "bg-white/5 text-gray-400"
                }`}>
                  <Shield size={32} />
                </div>
                <h4 className="text-lg font-bold text-white mb-2">Internship Coordinator</h4>
                <p className="text-xs text-gray-400 leading-relaxed">
                  Moderate student Q&A queues, promote resolved answers to official FAQs, resolve flag reports, and view system stats.
                </p>
              </button>
            </div>

            <div className="flex justify-end w-full">
              <button
                type="button"
                disabled={!selectedRole}
                onClick={() => setOnboardingStep(2)}
                className="flex items-center gap-2 rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-50 py-2.5 px-6 text-sm font-semibold text-white transition-colors"
              >
                Next Step
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: Profile Form */}
        {onboardingStep === 2 && (
          <div>
            <div className="mb-6 text-center">
              <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/10 px-3 py-1 text-xs font-semibold text-primary-300 border border-primary-500/20">
                Step 2 of 2: Profile Setup
              </span>
              <h3 className="mt-3 text-2xl font-bold text-white">Complete Your Profile</h3>
              <p className="mt-2 text-sm text-gray-400">
                Provide custom metadata for your {selectedRole === "user" ? "Student" : "Coordinator"} profile.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg bg-red-500/10 p-3 border border-red-500/20 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleOnboardingSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                  Full Name
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={onboardData.fullName}
                  onChange={handleOnboardChange}
                  required
                  placeholder="e.g. Riya Sharma"
                  className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
                />
              </div>

              {selectedRole === "user" ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                        College / University
                      </label>
                      <input
                        type="text"
                        name="college"
                        value={onboardData.college}
                        onChange={handleOnboardChange}
                        required
                        placeholder="e.g. Stanford University"
                        className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                        Branch / Major
                      </label>
                      <input
                        type="text"
                        name="major"
                        value={onboardData.major}
                        onChange={handleOnboardChange}
                        required
                        placeholder="e.g. Computer Science"
                        className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                        Current Semester
                      </label>
                      <select
                        name="semester"
                        value={onboardData.semester}
                        onChange={handleOnboardChange}
                        className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white focus:border-primary-500 focus:outline-none"
                      >
                        {Array.from({ length: 8 }).map((_, i) => (
                          <option key={i} value={`Semester ${i + 1}`} className="bg-surface-light text-white">
                            Semester {i + 1}
                          </option>
                        ))}
                        <option value="Graduate" className="bg-surface-light text-white">Graduate</option>
                        <option value="Other" className="bg-surface-light text-white">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                        Areas of Interest
                      </label>
                      <input
                        type="text"
                        name="interests"
                        value={onboardData.interests}
                        onChange={handleOnboardChange}
                        placeholder="e.g. Web Dev, AI, Algorithms"
                        className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                        Department / Organization
                      </label>
                      <input
                        type="text"
                        name="department"
                        value={onboardData.department}
                        onChange={handleOnboardChange}
                        required
                        placeholder="e.g. Computer Science Dept"
                        className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                        Staff ID / Access Code
                      </label>
                      <input
                        type="text"
                        name="staffId"
                        value={onboardData.staffId}
                        onChange={handleOnboardChange}
                        required
                        placeholder="e.g. STF-2026-X9"
                        className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                      Authorization Tier
                    </label>
                    <select
                      name="authTier"
                      value={onboardData.authTier}
                      onChange={handleOnboardChange}
                      className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white focus:border-primary-500 focus:outline-none"
                    >
                      <option value="Level 1" className="bg-surface-light text-white">Level 1 (Basic Moderator)</option>
                      <option value="Level 2" className="bg-surface-light text-white">Level 2 (Senior Moderator)</option>
                      <option value="Super Admin" className="bg-surface-light text-white">Super Admin (System Owner)</option>
                    </select>
                  </div>
                </>
              )}

              <div className="flex justify-between items-center pt-4">
                <button
                  type="button"
                  onClick={() => setOnboardingStep(1)}
                  className="flex items-center gap-2 rounded-lg border border-white/10 bg-surface hover:bg-surface-lighter py-2.5 px-5 text-sm font-semibold text-white transition-colors"
                >
                  <ArrowLeft size={16} />
                  Back
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-primary-500 to-indigo-600 py-2.5 px-6 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 hover:brightness-110 active:scale-95 transition-all duration-300 disabled:opacity-50"
                >
                  {loading ? "Saving..." : (
                    <>
                      Complete Setup
                      <Check size={16} />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}

      </div>
    </div>
  );
};

export default AuthModal;
