import { useState, useEffect, useRef } from "react";
import { X, Lock, Mail, User as UserIcon, ArrowLeft, CheckCircle, KeyRound, ShieldCheck, Eye, EyeOff } from "lucide-react";
import api from "../api/axios";

const AuthModal = ({ isOpen, onClose, onAuthSuccess, initialMode = "login" }) => {
  const [isLogin, setIsLogin] = useState(initialMode === "register" ? false : true);
  const [mode, setMode] = useState("auth"); // "auth" | "forgot"
  const [forgotStep, setForgotStep] = useState(1); // 1=email, 2=otp, 3=reset, 4=success

  // Sync tab when initialMode changes (e.g. Sign Up clicked from navbar)
  useEffect(() => {
    setIsLogin(initialMode !== "register");
  }, [initialMode]);

  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: "",
    internshipStartDate: ""
  });

  // Forgot password state
  const [forgotEmail, setForgotEmail] = useState("");
  const [otpDigits, setOtpDigits] = useState(["", "", "", "", "", ""]);
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // OTP resend countdown
  const [countdown, setCountdown] = useState(0);
  const countdownRef = useRef(null);

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP input refs for auto-focus
  const otpRefs = useRef([]);

  // Password visibility state
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      countdownRef.current = setTimeout(() => setCountdown(c => c - 1), 1000);
    }
    return () => clearTimeout(countdownRef.current);
  }, [countdown]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
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
        : { 
            username: formData.username, 
            name: formData.name, 
            email: formData.email, 
            password: formData.password,
            internshipStartDate: formData.internshipStartDate 
          };

      const response = await api.post(endpoint, payload);
      
      if (response.data.success) {
        const { accessToken, user } = response.data.data;
        localStorage.setItem("token", accessToken);
        localStorage.setItem("user", JSON.stringify(user));
        onAuthSuccess(user);
        handleClose();
      }
    } catch (err) {
      console.error(err);
      let errMsg = "Authentication failed. Please check your credentials.";
      if (err.response?.data?.error) {
        const errorData = err.response.data.error;
        if (errorData.code === "VALIDATION_ERROR" && errorData.fields) {
          errMsg = Object.values(errorData.fields).join(". ");
        } else {
          errMsg = errorData.message || errMsg;
        }
      }
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({ username: "", name: "", email: "", password: "", internshipStartDate: "" });
    setError("");
    setMode("auth");
    setForgotStep(1);
    setForgotEmail("");
    setOtpDigits(["", "", "", "", "", ""]);
    setResetToken("");
    setNewPassword("");
    setConfirmPassword("");
    setCountdown(0);
    onClose();
  };

  // ─── Forgot Password Handlers ──────────────────────────────────────

  const handleForgotPasswordClick = () => {
    setMode("forgot");
    setForgotStep(1);
    setError("");
    setForgotEmail(formData.email || "");
  };

  const handleBackToLogin = () => {
    setMode("auth");
    setForgotStep(1);
    setError("");
    setForgotEmail("");
    setOtpDigits(["", "", "", "", "", ""]);
  };

  // Step 1: Send OTP
  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await api.post("/auth/forgot-password", { email: forgotEmail });
      setForgotStep(2);
      setCountdown(60);
      setOtpDigits(["", "", "", "", "", ""]);
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || "Failed to send OTP. Please try again.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const otp = otpDigits.join("");
    if (otp.length !== 6) {
      setError("Please enter all 6 digits.");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/auth/verify-otp", { email: forgotEmail, otp });
      if (res.data.success) {
        setResetToken(res.data.data.resetToken);
        setForgotStep(3);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || "OTP verification failed.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Reset Password
  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }

    if (newPassword.length < 8) {
      setError("Password must be at least 8 characters.");
      setLoading(false);
      return;
    }

    if (!/[A-Z]/.test(newPassword)) {
      setError("Password must contain at least one uppercase letter.");
      setLoading(false);
      return;
    }

    if (!/[0-9]/.test(newPassword)) {
      setError("Password must contain at least one digit.");
      setLoading(false);
      return;
    }

    try {
      const res = await api.post("/auth/reset-password", { resetToken, newPassword });
      if (res.data.success) {
        setForgotStep(4); // success step
        // Auto redirect to login after 3 seconds
        setTimeout(() => {
          setMode("auth");
          setIsLogin(true);
          setForgotStep(1);
          setNewPassword("");
          setConfirmPassword("");
          setResetToken("");
          setForgotEmail("");
        }, 3000);
      }
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || "Password reset failed.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // OTP digit input handler
  const handleOtpChange = (idx, value) => {
    if (!/^\d?$/.test(value)) return; // only allow single digit

    const newDigits = [...otpDigits];
    newDigits[idx] = value;
    setOtpDigits(newDigits);
    setError("");

    // Auto-focus next input
    if (value && idx < 5) {
      otpRefs.current[idx + 1]?.focus();
    }
  };

  const handleOtpKeyDown = (idx, e) => {
    // Backspace focuses previous input
    if (e.key === "Backspace" && !otpDigits[idx] && idx > 0) {
      otpRefs.current[idx - 1]?.focus();
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (pasted.length > 0) {
      const newDigits = [...otpDigits];
      for (let i = 0; i < 6; i++) {
        newDigits[i] = pasted[i] || "";
      }
      setOtpDigits(newDigits);
      // Focus the last filled input or the next empty one
      const focusIdx = Math.min(pasted.length, 5);
      otpRefs.current[focusIdx]?.focus();
    }
  };

  const handleResendOTP = async () => {
    if (countdown > 0) return;
    setLoading(true);
    setError("");
    try {
      await api.post("/auth/forgot-password", { email: forgotEmail });
      setCountdown(60);
      setOtpDigits(["", "", "", "", "", ""]);
    } catch (err) {
      const errMsg = err.response?.data?.error?.message || "Failed to resend OTP.";
      setError(errMsg);
    } finally {
      setLoading(false);
    }
  };

  // ─── Step indicator ─────────────────────────────────────────────────
  const StepIndicator = () => {
    const steps = [
      { num: 1, label: "Email" },
      { num: 2, label: "Verify" },
      { num: 3, label: "Reset" }
    ];

    return (
      <div className="flex items-center justify-center gap-2 mb-6">
        {steps.map((s, i) => (
          <div key={s.num} className="flex items-center gap-2">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                forgotStep > s.num
                  ? "bg-green-500/20 text-green-400 border border-green-500/40"
                  : forgotStep === s.num
                  ? "bg-primary-500/20 text-primary-400 border border-primary-500/40 shadow-lg shadow-primary-500/20"
                  : "bg-white/5 text-gray-600 border border-white/10"
              }`}
            >
              {forgotStep > s.num ? "✓" : s.num}
            </div>
            {i < steps.length - 1 && (
              <div className={`w-8 h-0.5 transition-all duration-300 ${
                forgotStep > s.num ? "bg-green-500/40" : "bg-white/10"
              }`} />
            )}
          </div>
        ))}
      </div>
    );
  };

  // ─── Forgot Password Render ─────────────────────────────────────────
  const renderForgotPassword = () => {
    // Step 4: Success
    if (forgotStep === 4) {
      return (
        <div className="text-center py-6">
          <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4 animate-bounce-slow">
            <CheckCircle className="h-8 w-8 text-green-400" />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Password Reset Successful!</h3>
          <p className="text-sm text-gray-400 mb-4">
            Your password has been updated. Redirecting to login...
          </p>
          <div className="w-full bg-white/5 rounded-full h-1 overflow-hidden">
            <div className="h-full bg-gradient-to-r from-green-500 to-emerald-400 rounded-full animate-progress" />
          </div>
        </div>
      );
    }

    return (
      <>
        {/* Back button */}
        <button
          onClick={handleBackToLogin}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-colors mb-4"
        >
          <ArrowLeft size={14} />
          Back to Login
        </button>

        <div className="mb-5 text-center">
          <div className="w-12 h-12 mx-auto rounded-xl bg-primary-500/10 border border-primary-500/30 flex items-center justify-center mb-3">
            {forgotStep === 1 && <Mail className="h-5 w-5 text-primary-400" />}
            {forgotStep === 2 && <ShieldCheck className="h-5 w-5 text-primary-400" />}
            {forgotStep === 3 && <KeyRound className="h-5 w-5 text-primary-400" />}
          </div>
          <h3 className="text-xl font-bold text-white">
            {forgotStep === 1 && "Forgot Password?"}
            {forgotStep === 2 && "Verify Your Email"}
            {forgotStep === 3 && "Create New Password"}
          </h3>
          <p className="mt-1.5 text-xs text-gray-400">
            {forgotStep === 1 && "Enter your registered email to receive a verification code."}
            {forgotStep === 2 && `Enter the 6-digit code sent to ${forgotEmail}`}
            {forgotStep === 3 && "Choose a strong password for your account."}
          </p>
        </div>

        <StepIndicator />

        {error && (
          <div className="mb-4 rounded-lg bg-red-500/10 p-3 border border-red-500/20 text-xs text-red-400">
            {error}
          </div>
        )}

        {/* Step 1: Email */}
        {forgotStep === 1 && (
          <form onSubmit={handleSendOTP} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute top-3 left-3 h-4 w-4 text-gray-500" />
                <input
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => { setForgotEmail(e.target.value); setError(""); }}
                  required
                  placeholder="riya@example.com"
                  className="w-full rounded-lg border border-white/10 bg-surface py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-primary-400/50 focus:outline-none"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-gradient-to-r from-primary-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 hover:brightness-110 active:scale-95 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Verification Code"}
            </button>
          </form>
        )}

        {/* Step 2: OTP */}
        {forgotStep === 2 && (
          <form onSubmit={handleVerifyOTP} className="space-y-5">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-3 text-center">
                Enter 6-digit Code
              </label>
              <div className="flex justify-center gap-2" onPaste={handleOtpPaste}>
                {otpDigits.map((digit, idx) => (
                  <input
                    key={idx}
                    ref={el => otpRefs.current[idx] = el}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    className={`w-11 h-13 rounded-lg border text-center text-lg font-bold transition-all duration-200 focus:outline-none ${
                      digit
                        ? "border-primary-500/60 bg-primary-500/10 text-white shadow-lg shadow-primary-500/10"
                        : "border-white/10 bg-surface text-white"
                    } focus:border-primary-400/50 focus:shadow-lg focus:shadow-primary-500/20`}
                    style={{ fontSize: "1.25rem" }}
                  />
                ))}
              </div>
            </div>

            {/* Resend OTP */}
            <div className="text-center">
              {countdown > 0 ? (
                <p className="text-xs text-gray-500">
                  Resend code in <span className="text-primary-400 font-semibold">{countdown}s</span>
                </p>
              ) : (
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={loading}
                  className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors disabled:opacity-50"
                >
                  Didn't receive code? Resend OTP
                </button>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || otpDigits.join("").length !== 6}
              className="w-full rounded-lg bg-gradient-to-r from-primary-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 hover:brightness-110 active:scale-95 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Verifying..." : "Verify Code"}
            </button>
          </form>
        )}

        {/* Step 3: New Password */}
        {forgotStep === 3 && (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                New Password
              </label>
              <div className="relative">
                <Lock className="absolute top-3 left-3 h-4 w-4 text-gray-500" />
                <input
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => { setNewPassword(e.target.value); setError(""); }}
                  required
                  placeholder="Min 8 chars, 1 uppercase, 1 digit"
                  className="w-full rounded-lg border border-white/10 bg-surface py-2.5 pl-10 pr-10 text-sm text-white placeholder-gray-600 focus:border-primary-400/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label={showNewPassword ? "Hide password" : "Show password"}
                >
                  {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                Confirm Password
              </label>
              <div className="relative">
                <Lock className="absolute top-3 left-3 h-4 w-4 text-gray-500" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setError(""); }}
                  required
                  placeholder="Re-enter your new password"
                  className="w-full rounded-lg border border-white/10 bg-surface py-2.5 pl-10 pr-10 text-sm text-white placeholder-gray-600 focus:border-primary-400/50 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 transition-colors"
                  aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {confirmPassword && newPassword !== confirmPassword && (
                <p className="mt-1 text-xs text-red-400">Passwords do not match</p>
              )}
            </div>

            {/* Password strength hints */}
            <div className="space-y-1">
              {[
                { check: newPassword.length >= 8, label: "At least 8 characters" },
                { check: /[A-Z]/.test(newPassword), label: "One uppercase letter" },
                { check: /[0-9]/.test(newPassword), label: "One digit" }
              ].map((rule, i) => (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center ${
                    rule.check ? "bg-green-500/20 text-green-400" : "bg-white/5 text-gray-600"
                  }`}>
                    {rule.check ? "✓" : "·"}
                  </div>
                  <span className={rule.check ? "text-green-400" : "text-gray-500"}>
                    {rule.label}
                  </span>
                </div>
              ))}
            </div>

            <button
              type="submit"
              disabled={loading || newPassword !== confirmPassword || newPassword.length < 8}
              className="w-full rounded-lg bg-gradient-to-r from-primary-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 hover:brightness-110 active:scale-95 transition-all duration-300 disabled:opacity-50"
            >
              {loading ? "Resetting..." : "Reset Password"}
            </button>
          </form>
        )}
      </>
    );
  };

  // ─── Main Render ────────────────────────────────────────────────────

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-surface-light p-8 shadow-2xl transition-all duration-300">
        
        {/* Close Button */}
        <button 
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {mode === "forgot" ? (
          renderForgotPassword()
        ) : (
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
                        className="w-full rounded-lg border border-white/10 bg-surface py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-primary-400/50 focus:outline-none"
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
                        className="w-full rounded-lg border border-white/10 bg-surface py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-primary-400/50 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                      Internship Start Date
                    </label>
                    <div className="relative">
                      <input
                        type="date"
                        name="internshipStartDate"
                        value={formData.internshipStartDate}
                        onChange={handleChange}
                        required
                        className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white focus:border-primary-400/50 focus:outline-none"
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
                    className="w-full rounded-lg border border-white/10 bg-surface py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-primary-400/50 focus:outline-none"
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
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    placeholder={isLogin ? "••••••••" : "Min 8 chars, 1 uppercase, 1 digit"}
                    className="w-full rounded-lg border border-white/10 bg-surface py-2.5 pl-10 pr-10 text-sm text-white placeholder-gray-600 focus:border-primary-400/50 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute top-3 right-3 text-gray-500 hover:text-gray-300 transition-colors"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* Forgot Password link — only on login */}
                {isLogin && (
                  <div className="mt-1.5 text-right">
                    <button
                      type="button"
                      onClick={handleForgotPasswordClick}
                      className="text-xs font-medium text-primary-400 hover:text-primary-300 transition-colors"
                    >
                      Forgot Password?
                    </button>
                  </div>
                )}
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

      </div>

      {/* Custom animation styles */}
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
        .animate-progress {
          animation: progress 3s ease-in-out;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default AuthModal;
