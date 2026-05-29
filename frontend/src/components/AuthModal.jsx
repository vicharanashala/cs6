import { useState } from "react";
import { X, Lock, Mail, User as UserIcon } from "lucide-react";
import api from "../api/axios";

const AuthModal = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    name: "",
    email: "",
    password: ""
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
    setFormData({ username: "", name: "", email: "", password: "" });
    setError("");
    onClose();
  };

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
                placeholder={isLogin ? "••••••••" : "Min 8 chars, 1 uppercase, 1 digit"}
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

      </div>
    </div>
  );
};

export default AuthModal;
