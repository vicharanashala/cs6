import { useState, useEffect } from "react";
import { X, HelpCircle, FileText, Tag, ChevronRight } from "lucide-react";
import api from "../api/axios";

const QuestionModal = ({ isOpen, onClose, categories = [], onQuestionCreated, draft, currentUser, onQuestionClick }) => {
  const [formData, setFormData] = useState({
    title: "",
    body: "",
    tags: "",
    category: ""
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [similarQuestions, setSimilarQuestions] = useState([]);

  useEffect(() => {
    if (isOpen) {
      if (draft) {
        setFormData({
          title: draft.title || "",
          body: draft.body || "",
          tags: draft.tags || "",
          category: draft.category || ""
        });
      } else {
        setFormData({
          title: "",
          body: "",
          tags: "",
          category: ""
        });
      }
      setError(null);
      setSimilarQuestions([]);
    }
  }, [isOpen, draft]);

  useEffect(() => {
    const checkSimilarity = async () => {
      if (formData.title.trim().length < 5) {
        setSimilarQuestions([]);
        return;
      }
      try {
        const parsedTags = formData.tags
          ? formData.tags.split(",").map(t => t.trim()).filter(t => t.length > 0)
          : [];

        const response = await api.post("/questions/duplicates", {
          title: formData.title,
          organizationId: currentUser?.organizationId || null,
          tags: parsedTags
        });
        if (response.data.success) {
          setSimilarQuestions(response.data.data || []);
        }
      } catch (err) {
        console.error("Error checking question similarity:", err);
      }
    };

    const delayDebounce = setTimeout(() => {
      checkSimilarity();
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [formData.title, formData.tags, currentUser]);

  if (!isOpen) return null;

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError(null);
  };

  const handleSaveDraft = () => {
    if (!currentUser?._id) {
      setError({ message: "You must be logged in to save drafts." });
      return;
    }
    const draftsKey = `drafts_${currentUser._id}`;
    const draftsList = JSON.parse(localStorage.getItem(draftsKey) || "[]");

    const draftId = draft?._id || `draft_${Date.now()}`;
    const draftData = {
      _id: draftId,
      title: formData.title,
      body: formData.body,
      category: formData.category,
      tags: formData.tags,
      createdAt: draft?.createdAt || new Date().toISOString()
    };

    const existingIndex = draftsList.findIndex(d => d._id === draftId);
    if (existingIndex > -1) {
      draftsList[existingIndex] = draftData;
    } else {
      draftsList.push(draftData);
    }

    localStorage.setItem(draftsKey, JSON.stringify(draftsList));
    onClose();
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
        if (draft?._id && currentUser?._id) {
          const draftsKey = `drafts_${currentUser._id}`;
          const drafts = JSON.parse(localStorage.getItem(draftsKey) || "[]");
          const updated = drafts.filter(d => d._id !== draft._id);
          localStorage.setItem(draftsKey, JSON.stringify(updated));
        }
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
            {similarQuestions.length > 0 && (
              <div className="mt-3 rounded-lg bg-indigo-500/10 border border-indigo-500/25 p-3.5 text-xs select-none">
                <p className="font-bold text-indigo-300 mb-2 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                  <HelpCircle size={14} className="text-indigo-400" />
                  Similar Questions Found
                </p>
                <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                  {similarQuestions.map((q) => (
                    <div 
                      key={q._id}
                      className="flex items-center justify-between gap-3 p-2 rounded bg-surface/50 border border-white/5"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-0.5 animate-pulse-subtle">
                          {q.isFAQ && (
                            <span className="rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider">
                              FAQ
                            </span>
                          )}
                          <span className="text-[10px] font-semibold text-indigo-400">
                            {q.similarity}% Match
                          </span>
                        </div>
                        <p className="text-gray-300 font-medium truncate text-[11px]">{q.title}</p>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (onQuestionClick) onQuestionClick(q);
                          }}
                          className="rounded bg-indigo-500 hover:bg-indigo-600 px-2 py-1 text-[10px] font-bold text-white transition-colors"
                        >
                          Open Question
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <p className="mt-2 text-[10px] text-gray-400 italic">
                  Not what you were looking for? You can continue posting your question below.
                </p>
              </div>
            )}
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

          {/* Submit and Save Draft Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={handleSaveDraft}
              className="flex-1 rounded-lg border border-white/10 bg-surface hover:bg-surface-lighter py-2.5 text-sm font-semibold text-gray-300 hover:text-white transition-all duration-200"
            >
              Save as Draft
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-[2] rounded-lg bg-gradient-to-r from-primary-500 to-indigo-600 py-2.5 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 hover:brightness-110 active:scale-95 transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              {loading ? "Submitting..." : "Submit Question"}
              <ChevronRight size={16} />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};

export default QuestionModal;
