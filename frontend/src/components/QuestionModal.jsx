import { useState } from "react";
import { X, HelpCircle, FileText, Tag, ChevronRight } from "lucide-react";
import api from "../api/axios";

const QuestionModal = ({ isOpen, onClose, categories = [], onQuestionCreated }) => {
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    tags: "",
    category: ""
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    // Form validation
    if (formData.title.length < 10 || formData.title.length > 150) {
      setError({ message: "Title must be between 10 and 150 characters." });
      setLoading(false);
      return;
    }
    if (formData.body.length < 20) {
      setError({ message: "Body must be at least 20 characters long." });
      setLoading(false);
      return;
    }

    try {
      const parsedTags = formData.tags
        .split(",")
        .map(t => t.trim())
        .filter(t => t.length > 0);

      const payload = {
        title: formData.title,
        body: formData.body,
        tags: parsedTags,
        category: formData.category
      };

      const token = localStorage.getItem("token");
      const response = await api.post("/questions", payload, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        onQuestionCreated(response.data.data);
        onClose();
        // Reset form
        setFormData({ title: "", body: "", tags: "", category: "" });
      }
    } catch (err) {
      console.error(err);
      const resErr = err.response?.data?.error;
      if (resErr?.code === "DUPLICATE_QUESTION") {
        setError({
          type: "duplicate",
          message: resErr.message,
          duplicateId: resErr.fields?.duplicateId,
          title: resErr.fields?.title
        });
      } else {
        setError({
          message: resErr?.message || "Failed to submit question. Ensure all fields are filled properly."
        });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
      <div className="relative w-full max-w-lg rounded-2xl border border-white/10 bg-surface-light p-8 shadow-2xl transition-all duration-300">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="mb-6">
          <h3 className="text-xl font-bold text-white flex items-center gap-2">
            <HelpCircle className="text-primary-400" />
            Submit an Internship Question
          </h3>
          <p className="mt-1 text-sm text-gray-400">
            Ask a question and allow the community to pitch in answers.
          </p>
        </div>

        {/* Error / Duplicate Warning */}
        {error && (
          <div className={`mb-6 rounded-lg p-4 border text-xs ${
            error.type === "duplicate" 
              ? "bg-amber-500/10 border-amber-500/20 text-amber-300"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            <p className="font-semibold">{error.message}</p>
            {error.type === "duplicate" && (
              <div className="mt-2 bg-black/30 p-2.5 rounded-md border border-amber-500/10">
                <p className="text-gray-400">Existing similar question:</p>
                <p className="font-medium text-white italic mt-1 font-sans">
                  "{error.title}"
                </p>
                <p className="text-gray-500 text-[10px] mt-1.5">
                  ID: {error.duplicateId}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
              Category
            </label>
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-3 text-sm text-white focus:border-primary-500 focus:outline-none"
            >
              <option value="" disabled className="text-gray-600">Select category...</option>
              {categories.map(cat => (
                <option key={cat._id} value={cat._id} className="text-white bg-surface-light">
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
              Question Title
            </label>
            <div className="relative">
              <FileText className="absolute top-3 left-3 h-4 w-4 text-gray-500" />
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                minLength={10}
                maxLength={150}
                placeholder="What is the deadline for the internship registration?"
                className="w-full rounded-lg border border-white/10 bg-surface py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-[10px] text-gray-500 text-right">
              {formData.title.length}/150 characters (min 10)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
              Detailed Description
            </label>
            <textarea
              name="body"
              value={formData.body}
              onChange={handleChange}
              required
              minLength={20}
              rows={4}
              placeholder="Provide context, links, or specific details to help others give high-quality answers..."
              className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none resize-none"
            />
            <p className="mt-1 text-[10px] text-gray-500 text-right">
              {formData.body.length} characters (min 20)
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
              Tags (comma separated)
            </label>
            <div className="relative">
              <Tag className="absolute top-3 left-3 h-4 w-4 text-gray-500" />
              <input
                type="text"
                name="tags"
                value={formData.tags}
                onChange={handleChange}
                placeholder="internship, deadline, registration"
                className="w-full rounded-lg border border-white/10 bg-surface py-2.5 pl-10 pr-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
              />
            </div>
            <p className="mt-1 text-[10px] text-gray-500">
              Provide up to 5 tags, e.g., fees, admissions, course
            </p>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-lg bg-gradient-to-r from-primary-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 hover:brightness-110 active:scale-95 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {loading ? "Submitting..." : "Submit Question"}
            <ChevronRight size={16} />
          </button>
        </form>

      </div>
    </div>
  );
};

export default QuestionModal;
