import { useState, useEffect } from "react";
import { 
  ArrowLeft, MessageSquare, ThumbsUp, Check, Award, 
  Send, CheckCircle2, Edit, Trash2, X, 
  ChevronUp, ChevronDown, ShieldAlert, Bookmark 
} from "lucide-react";
import api from "../api/axios";

const QuestionDetail = ({ question, onBack, currentUser, onAuthRequired }) => {
  const [answers, setAnswers] = useState([]);
  const [loadingAnswers, setLoadingAnswers] = useState(true);
  const [newAnswer, setNewAnswer] = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(question);

  // Question editing states
  const [isEditingQuestion, setIsEditingQuestion] = useState(false);
  const [editTitle, setEditTitle] = useState(question.title);
  const [editBody, setEditBody] = useState(question.body);
  const [editTags, setEditTags] = useState(question.tags?.join(", ") || "");
  const [editError, setEditError] = useState("");

  // Answer editing states
  const [editingAnswerId, setEditingAnswerId] = useState(null);
  const [editAnswerBody, setEditAnswerBody] = useState("");
  const [editAnswerError, setEditAnswerError] = useState("");

  // General message feedback
  const [feedbackMsg, setFeedbackMsg] = useState("");

  const [isSaved, setIsSaved] = useState(false);

  // Report Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState(null); // { id, type }
  const [reportReason, setReportReason] = useState("spam");
  const [reportDesc, setReportDesc] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportedIds, setReportedIds] = useState(new Set()); // IDs the current user already reported

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onAuthRequired();
      return;
    }
    setSubmittingReport(true);
    try {
      const response = await api.post("/reports", {
        targetType: reportTarget.type,
        targetId: reportTarget.id,
        type: reportReason,
        description: reportDesc
      });
      if (response.data.success) {
        setFeedbackMsg(`Thank you! The ${reportTarget.type} has been reported for review.`);
        setReportedIds(prev => new Set(prev).add(reportTarget.id));
        setIsReportModalOpen(false);
        setReportDesc("");
        setReportReason("spam");
      }
    } catch (error) {
      console.error("Error reporting content:", error);
      if (error.response?.status === 401) {
        alert("Your session has expired. Please log in again to report this content.");
      } else {
        alert(error.response?.data?.error?.message || "Failed to submit report.");
      }
    } finally {
      setSubmittingReport(false);
    }
  };

  const fetchBookmarkStatus = async () => {
    await Promise.resolve();
    try {
      const response = await api.get("/bookmarks");
      if (response.data.success) {
        const isBookmarked = response.data.data.some(q => q._id === question._id);
        setIsSaved(isBookmarked);
      }
    } catch (error) {
      console.error("Error loading bookmark status:", error);
    }
  };

  useEffect(() => {
    if (currentUser?._id && question?._id) {
      fetchBookmarkStatus();
    }
  }, [currentUser, question._id]);

  const handleToggleSave = async () => {
    if (!currentUser) {
      onAuthRequired();
      return;
    }
    try {
      const response = await api.post("/bookmarks/toggle", { questionId: question._id });
      if (response.data.success) {
        setIsSaved(response.data.isBookmarked);
        setFeedbackMsg(response.data.message);
      }
    } catch (error) {
      console.error("Error toggling bookmark:", error);
      setFeedbackMsg("Failed to toggle bookmark status.");
    }
  };

  const handleToggleHelpful = async () => {
    if (!currentUser) {
      onAuthRequired();
      return;
    }
    try {
      const response = await api.patch(`/questions/${currentQuestion._id}/helpful`);
      if (response.data.success) {
        const hasVoted = response.data.data.hasVoted;
        let newVotes = currentQuestion.helpfulVotes ? [...currentQuestion.helpfulVotes] : [];
        if (hasVoted && !newVotes.includes(currentUser._id)) {
          newVotes.push(currentUser._id);
        } else if (!hasVoted) {
          newVotes = newVotes.filter(id => id !== currentUser._id);
        }
        setCurrentQuestion(prev => ({
          ...prev,
          helpfulVotes: newVotes,
          helpfulVotesCount: response.data.data.helpfulVotesCount
        }));
      }
    } catch (error) {
      console.error("Error toggling helpful vote:", error);
    }
  };

  const fetchMyReports = async () => {
    await Promise.resolve();
    try {
      const response = await api.get("/reports/my");
      if (response.data.success) {
        setReportedIds(new Set(response.data.data.map(r => r.targetId)));
      }
    } catch (error) {
      console.error("Error fetching user reports:", error);
    }
  };

  const fetchQuestionDetails = async () => {
    await Promise.resolve();
    try {
      const response = await api.get(`/questions/${question._id}`);
      if (response.data.success) {
        setCurrentQuestion(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching question details:", error);
    }
  };

  const fetchAnswers = async () => {
    await Promise.resolve();
    try {
      const response = await api.get(`/questions/${question._id}/answers`);
      if (response.data.success) {
        setAnswers(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching answers:", error);
    } finally {
      setLoadingAnswers(false);
    }
  };

  useEffect(() => {
    fetchQuestionDetails();
    fetchAnswers();
    if (currentUser) {
      fetchMyReports();
    }
  }, [question._id]);

  // Upvote/Downvote handling
  const handleVote = async (answerId, voteType) => {
    if (!currentUser) {
      onAuthRequired();
      return;
    }

    try {
      const response = await api.post(`/questions/${currentQuestion._id}/answers/${answerId}/${voteType}`);
      if (response.data.success) {
        // Update local state dynamically
        setAnswers(prev => prev.map(ans => {
          if (ans._id === answerId) {
            return {
              ...ans,
              upvotes: response.data.data.upvotes || ans.upvotes,
              downvotes: response.data.data.downvotes || ans.downvotes,
              upvoteCount: response.data.data.upvoteCount ?? ans.upvoteCount,
              reputationScore: response.data.data.reputationScore ?? ans.reputationScore
            };
          }
          return ans;
        }));
      }
    } catch (error) {
      console.error(`Error voting ${voteType}:`, error);
    }
  };

  const handleSelectBest = async (answerId) => {
    try {
      const response = await api.patch(`/questions/${currentQuestion._id}/answers/${answerId}/best`);
      if (response.data.success) {
        // Refresh question state and answer list
        const updatedQuestion = response.data.data.question;
        setCurrentQuestion(updatedQuestion);
        fetchAnswers();
        setFeedbackMsg("Definitive solution marked successfully!");
      }
    } catch (error) {
      console.error("Error selecting best answer:", error);
    }
  };

  const handleAnswerSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      onAuthRequired();
      return;
    }

    if (newAnswer.trim().length < 30 || newAnswer.trim().length > 2000) {
      setSubmitError("Answer body must be between 30 and 2000 characters.");
      return;
    }

    setSubmitting(true);
    setSubmitError("");

    try {
      const response = await api.post(`/questions/${currentQuestion._id}/answers`, {
        body: newAnswer
      });

      if (response.data.success) {
        setNewAnswer("");
        setSubmitError("Success! Your answer has been submitted and is pending moderation approval.");
        fetchAnswers();
      }
    } catch (error) {
      console.error(error);
      setSubmitError(error.response?.data?.error?.message || "Failed to submit answer. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // CRUD: Edit Question
  const handleEditQuestionSubmit = async (e) => {
    e.preventDefault();
    setEditError("");

    if (editTitle.trim().length < 10 || editTitle.trim().length > 150) {
      setEditError("Title must be between 10 and 150 characters.");
      return;
    }
    if (editBody.trim().length < 20) {
      setEditError("Body must be at least 20 characters.");
      return;
    }

    try {
      const parsedTags = editTags.split(",").map(t => t.trim()).filter(t => t !== "");
      const response = await api.patch(`/questions/${currentQuestion._id}`, {
        title: editTitle,
        body: editBody,
        tags: parsedTags
      });

      if (response.data.success) {
        setCurrentQuestion(response.data.data);
        setIsEditingQuestion(false);
        setFeedbackMsg("Question updated successfully.");
      }
    } catch (error) {
      console.error(error);
      setEditError(error.response?.data?.error?.message || "Failed to update question.");
    }
  };

  // CRUD: Delete Question
  const handleDeleteQuestion = async () => {
    if (!window.confirm("Are you sure you want to delete this question? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await api.delete(`/questions/${currentQuestion._id}`);
      // 204 No Content has no body, so check status
      if (response.status === 204 || response.data?.success) {
        alert("Question deleted successfully.");
        onBack();
      }
    } catch (error) {
      console.error(error);
      alert("Failed to delete question. Make sure you have the required permissions.");
    }
  };

  // CRUD: Edit Answer
  const handleEditAnswerSubmit = async (e, answerId) => {
    e.preventDefault();
    setEditAnswerError("");

    if (editAnswerBody.trim().length < 30 || editAnswerBody.trim().length > 2000) {
      setEditAnswerError("Answer must be between 30 and 2000 characters.");
      return;
    }

    try {
      const response = await api.patch(`/questions/${currentQuestion._id}/answers/${answerId}`, {
        body: editAnswerBody
      });

      if (response.data.success) {
        setAnswers(prev => prev.map(ans => ans._id === answerId ? { ...ans, body: response.data.data.body } : ans));
        setEditingAnswerId(null);
        setFeedbackMsg("Answer updated successfully.");
      }
    } catch (error) {
      console.error(error);
      setEditAnswerError(error.response?.data?.error?.message || "Failed to update answer.");
    }
  };

  // CRUD: Delete Answer
  const handleDeleteAnswer = async (answerId) => {
    if (!window.confirm("Are you sure you want to delete this answer?")) {
      return;
    }

    try {
      const response = await api.delete(`/questions/${currentQuestion._id}/answers/${answerId}`);
      if (response.status === 204 || response.data?.success) {
        setAnswers(prev => prev.filter(ans => ans._id !== answerId));
        setFeedbackMsg("Answer deleted successfully.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to delete answer.");
    }
  };

  // MODERATION: Approve/Reject answers
  const handleApproveAnswer = async (answerId) => {
    try {
      const response = await api.patch(`/moderation/${answerId}/approve`);
      if (response.data.success) {
        setAnswers(prev => prev.map(ans => ans._id === answerId ? { ...ans, status: "visible", moderationState: "approved" } : ans));
        setFeedbackMsg("Answer approved and made public.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to approve answer.");
    }
  };

  const handleRejectAnswer = async (answerId) => {
    try {
      const response = await api.patch(`/moderation/${answerId}/reject`);
      if (response.data.success) {
        setAnswers(prev => prev.filter(ans => ans._id !== answerId));
        setFeedbackMsg("Answer rejected and removed.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to reject answer.");
    }
  };

  // MODERATION: Promote/Demote FAQ
  const handlePromoteFAQ = async () => {
    try {
      const response = await api.post(`/questions/${currentQuestion._id}/faq`);
      if (response.data.success) {
        setCurrentQuestion(response.data.data);
        setFeedbackMsg("Question promoted to Official FAQ!");
      }
    } catch (error) {
      console.error(error);
      alert(error.response?.data?.error?.message || "Failed to promote to FAQ.");
    }
  };

  const handleDemoteFAQ = async () => {
    try {
      const response = await api.delete(`/questions/${currentQuestion._id}/faq`);
      if (response.data.success) {
        setCurrentQuestion(response.data.data);
        setFeedbackMsg("Question removed from Official FAQs.");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to remove from FAQ.");
    }
  };

  const isModeratorOrAdmin = currentUser && ["moderator", "admin"].includes(currentUser.role);
  const isAdmin = currentUser?.role === "admin";

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      
      {/* Back button */}
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        Back
      </button>

      {/* Global alert feedback */}
      {feedbackMsg && (
        <div className="mb-6 rounded-lg bg-indigo-500/10 p-3 border border-indigo-500/20 text-xs text-indigo-300 flex items-center justify-between">
          <span>{feedbackMsg}</span>
          <button onClick={() => setFeedbackMsg("")} className="text-gray-400 hover:text-white">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Main Question Card / Editor */}
      <div className="rounded-2xl border border-white/5 bg-surface-light p-8 shadow-xl mb-8 relative">
        {isEditingQuestion ? (
          /* Question Edit Mode */
          <form onSubmit={handleEditQuestionSubmit} className="space-y-4">
            <h3 className="text-lg font-bold text-white mb-2">Edit Question</h3>
            
            {editError && (
              <div className="rounded-lg bg-red-500/10 p-3 border border-red-500/20 text-xs text-red-400">
                {editError}
              </div>
            )}

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Title</label>
              <input
                type="text"
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                required
                className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Description (Markdown Supported)</label>
              <textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                required
                rows={6}
                className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white focus:border-primary-500 focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Tags (Comma Separated)</label>
              <input
                type="text"
                value={editTags}
                onChange={(e) => setEditTags(e.target.value)}
                placeholder="e.g. placements, internships, career"
                className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white focus:border-primary-500 focus:outline-none"
              />
            </div>

            <div className="flex gap-3 justify-end pt-2">
              <button
                type="button"
                onClick={() => setIsEditingQuestion(false)}
                className="rounded-lg border border-white/10 bg-surface hover:bg-surface-lighter py-2 px-4 text-xs font-semibold text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="rounded-lg bg-primary-500 hover:bg-primary-600 py-2 px-5 text-xs font-semibold text-white transition-colors"
              >
                Save Changes
              </button>
            </div>
          </form>
        ) : (
          /* Question Display Mode */
          <>
            <div className="flex flex-wrap gap-2 items-center mb-4">
              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                currentQuestion.status === "resolved" 
                  ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                  : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
              }`}>
                {currentQuestion.status === "resolved" && <CheckCircle2 size={10} />}
                {currentQuestion.status}
              </span>
              {currentQuestion.isFAQ && (
                <span className="inline-flex rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-semibold">
                  Official FAQ
                </span>
              )}
              <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">
                Views: {currentQuestion.views}
              </span>
            </div>

            <div className="flex justify-between items-start gap-4 mb-4">
              <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
                {currentQuestion.title}
              </h1>
              {currentUser && (
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={handleToggleHelpful}
                    className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border transition-all duration-200 text-xs font-semibold ${
                      currentQuestion.helpfulVotes?.includes(currentUser?._id)
                        ? "bg-primary-500/20 text-primary-400 border-primary-500/30"
                        : "bg-surface border-white/5 text-gray-400 hover:text-white hover:border-white/10"
                    }`}
                    title={currentQuestion.helpfulVotes?.includes(currentUser?._id) ? "Marked as Helpful" : "Mark as Helpful"}
                  >
                    <ThumbsUp size={16} className={currentQuestion.helpfulVotes?.includes(currentUser?._id) ? "fill-current" : ""} />
                    <span>Helpful ({currentQuestion.helpfulVotesCount || 0})</span>
                  </button>
                  <button
                    onClick={handleToggleSave}
                    className={`p-2.5 rounded-xl border transition-colors shrink-0 ${
                      isSaved 
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-400 hover:bg-amber-500/25" 
                        : "bg-surface border-white/5 text-gray-400 hover:text-white hover:border-white/10"
                    }`}
                    title={isSaved ? "Remove Bookmark" : "Save / Bookmark FAQ"}
                  >
                    <Bookmark size={18} className={isSaved ? "fill-amber-400" : ""} />
                  </button>
                </div>
              )}
            </div>

            <p className="text-gray-300 text-sm sm:text-base leading-relaxed mb-6 whitespace-pre-wrap">
              {currentQuestion.body}
            </p>

            <div className="flex items-center justify-between border-t border-white/5 pt-6 mt-6 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/20 text-xs font-bold uppercase">
                  {currentQuestion.author?.name?.substring(0, 2) || currentQuestion.author?.username?.substring(0, 2) || "AN"}
                </div>
                <div>
                  <p className="text-xs font-semibold text-white">
                    {currentQuestion.author?.name || currentQuestion.author?.username || "Anonymous"}
                  </p>
                  <p className="text-[10px] text-gray-500">
                    {currentQuestion.author?.badgeLevel || "Newbie"} • {new Date(currentQuestion.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Action Buttons: Edit, Delete, Promote FAQ */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Lifecycle Phase Override (Admin/Coordinator only) */}
                {isModeratorOrAdmin && (
                  <div className="flex items-center gap-2 rounded bg-surface border border-white/5 py-1 px-3 text-xs text-gray-300">
                    <span className="font-semibold text-gray-400">Lifecycle Phase:</span>
                    <select
                      value={currentQuestion.lifecycleBucket || ""}
                      onChange={async (e) => {
                        const newBucket = e.target.value === "" ? null : e.target.value;
                        try {
                          const response = await api.patch(`/questions/${currentQuestion._id}`, {
                            lifecycleBucket: newBucket
                          });
                          if (response.data.success) {
                            setCurrentQuestion(response.data.data);
                            setFeedbackMsg("Lifecycle phase overridden successfully.");
                          }
                        } catch (error) {
                          console.error("Error overriding lifecycle bucket:", error);
                          alert(error.response?.data?.error?.message || "Failed to update lifecycle phase.");
                        }
                      }}
                      className="bg-transparent border-none text-xs text-white focus:outline-none focus:ring-0 cursor-pointer"
                    >
                      <option value="" className="bg-surface-light text-white">None (Automatic)</option>
                      <option value="onboarding" className="bg-surface-light text-white">Onboarding (Days 0-3)</option>
                      <option value="documentation" className="bg-surface-light text-white">Documentation (Days 4-7)</option>
                      <option value="vibe" className="bg-surface-light text-white">ViBe Platform (Days 8-14)</option>
                      <option value="projects" className="bg-surface-light text-white">Projects (Days 15+)</option>
                    </select>
                  </div>
                )}

                {/* FAQ promotion (Admin only, when resolved) */}
                {isAdmin && currentQuestion.status === "resolved" && (
                  <button
                    onClick={currentQuestion.isFAQ ? handleDemoteFAQ : handlePromoteFAQ}
                    className={`text-xs font-semibold px-3.5 py-1.5 rounded-lg border transition-colors ${
                      currentQuestion.isFAQ 
                        ? "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20" 
                        : "bg-indigo-500/10 border-indigo-500/20 text-indigo-400 hover:bg-indigo-500/20"
                    }`}
                  >
                    {currentQuestion.isFAQ ? "Remove FAQ Status" : "Promote to Official FAQ"}
                  </button>
                )}

                {/* Edit (Author only, not admin) */}
                {currentUser?._id === currentQuestion.author?._id && !isAdmin && (
                  <button
                    onClick={() => setIsEditingQuestion(true)}
                    className="flex items-center gap-1 rounded bg-surface hover:bg-surface-lighter py-1.5 px-3 text-xs text-gray-300 hover:text-white border border-white/5 transition-colors"
                    title="Edit Question"
                  >
                    <Edit size={12} />
                    Edit
                  </button>
                )}

                {/* Delete (Author or admin) */}
                {(currentUser?._id === currentQuestion.author?._id || isAdmin) && (
                  <button
                    onClick={handleDeleteQuestion}
                    className="flex items-center gap-1 rounded bg-red-500/10 border border-red-500/20 py-1.5 px-3 text-xs text-red-400 hover:bg-red-500/20 transition-colors"
                    title="Delete Question"
                  >
                    <Trash2 size={12} />
                    Delete
                  </button>
                )}

                {/* Report Question (Any logged in user who isn't the author, author is not admin, and current user is not admin) */}
                {currentUser && 
                 !isAdmin &&
                 currentUser._id !== currentQuestion.author?._id && 
                 currentQuestion.author?.role !== "admin" && (
                  <button
                    onClick={() => {
                      setReportTarget({ id: currentQuestion._id, type: "question" });
                      setIsReportModalOpen(true);
                    }}
                    className={`flex items-center gap-1 rounded py-1.5 px-3 text-xs transition-colors border ${
                      reportedIds.has(currentQuestion._id)
                        ? "bg-gray-500/10 border-gray-500/20 text-gray-500 cursor-not-allowed opacity-50"
                        : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                    }`}
                    title={reportedIds.has(currentQuestion._id) ? "You have already reported this question" : "Report Question"}
                    disabled={reportedIds.has(currentQuestion._id)}
                  >
                    <ShieldAlert size={12} />
                    {reportedIds.has(currentQuestion._id) ? "Reported" : "Report"}
                  </button>
                )}
              </div>
            </div>

            {/* Tags row */}
            {currentQuestion.tags && currentQuestion.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-4">
                {currentQuestion.tags.map((tag, idx) => (
                  <span key={idx} className="rounded bg-surface px-2.5 py-1 text-[10px] font-medium text-gray-400 border border-white/5">
                    #{tag}
                  </span>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Answers Section */}
      <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
        <MessageSquare size={18} className="text-primary-400" />
        Answers ({answers.length})
      </h3>

      {loadingAnswers ? (
        <div className="flex flex-col items-center py-12">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <p className="mt-4 text-xs text-gray-500">Loading answers...</p>
        </div>
      ) : answers.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-surface-light/40 p-8 text-center mb-8">
          <p className="text-gray-500 text-sm">No answers submitted yet.</p>
        </div>
      ) : (
        <div className="space-y-6 mb-8">
          {answers.map((ans) => {
            const hasUpvoted = currentUser && ans.upvotes?.includes(currentUser._id);
            const hasDownvoted = currentUser && ans.downvotes?.includes(currentUser._id);
            const isEditingThisAnswer = editingAnswerId === ans._id;

            return (
              <div 
                key={ans._id}
                className={`relative rounded-xl border p-6 transition-all duration-300 ${
                  ans.isBestAnswer 
                    ? "border-emerald-500/20 bg-emerald-500/5 shadow-lg shadow-emerald-500/2" 
                    : "border-white/5 bg-surface-light hover:border-white/10"
                }`}
              >
                {/* Best Answer Badge */}
                {ans.isBestAnswer && (
                  <div className="absolute top-4 right-4 flex items-center gap-1.5 text-xs font-bold text-emerald-400 uppercase tracking-wider">
                    <Award size={14} />
                    Best Answer
                  </div>
                )}

                {/* Pending Moderation Notice */}
                {(ans.status === "pending" || ans.moderationState === "pending") && (
                  <div className="mb-4 inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 px-3 py-1 text-[10px] font-semibold">
                    <ShieldAlert size={12} />
                    Pending Moderator Review
                  </div>
                )}

                {isEditingThisAnswer ? (
                  /* Edit Answer Form */
                  <form onSubmit={(e) => handleEditAnswerSubmit(e, ans._id)} className="space-y-3">
                    {editAnswerError && (
                      <div className="rounded bg-red-500/10 p-2.5 border border-red-500/20 text-xs text-red-400">
                        {editAnswerError}
                      </div>
                    )}
                    <textarea
                      value={editAnswerBody}
                      onChange={(e) => setEditAnswerBody(e.target.value)}
                      required
                      rows={4}
                      className="w-full rounded-lg border border-white/10 bg-surface py-2 px-3.5 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none resize-none"
                    />
                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingAnswerId(null)}
                        className="rounded border border-white/10 bg-surface hover:bg-surface-lighter py-1.5 px-3 text-[10px] font-semibold text-white transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="rounded bg-primary-500 hover:bg-primary-600 py-1.5 px-3.5 text-[10px] font-semibold text-white transition-colors"
                      >
                        Save
                      </button>
                    </div>
                  </form>
                ) : (
                  /* Display Answer Body */
                  <p className="text-gray-300 text-sm leading-relaxed mb-6 whitespace-pre-wrap pr-16 sm:pr-0">
                    {ans.body}
                  </p>
                )}

                {/* Author, Actions, and Voting Registry */}
                {!isEditingThisAnswer && (
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-t border-white/5 pt-4 mt-4">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[10px] font-bold uppercase">
                        {ans.author?.name?.substring(0, 2) || ans.author?.username?.substring(0, 2) || "AN"}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-white">
                          {ans.author?.name || ans.author?.username || "Anonymous"}
                        </p>
                        <p className="text-[10px] text-gray-500 font-mono">
                          {ans.author?.role === 'admin' ? 'Coordinator' : 'Student'} • Reputation: {ans.reputationScore ?? 0}
                        </p>
                      </div>
                    </div>

                    {/* Action Panel: Voting, Edit, Delete, Moderation */}
                    <div className="flex items-center justify-between sm:justify-end gap-3 flex-wrap">
                      
                      {/* Admin Pending Approve/Reject controls */}
                      {isModeratorOrAdmin && (ans.status === "pending" || ans.moderationState === "pending") && (
                        <div className="flex gap-1.5">
                          <button
                            onClick={() => handleApproveAnswer(ans._id)}
                            className="flex items-center gap-1 rounded bg-emerald-500/20 border border-emerald-500/30 py-1 px-2.5 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/35 transition-colors"
                          >
                            <Check size={10} />
                            Approve
                          </button>
                          <button
                            onClick={() => handleRejectAnswer(ans._id)}
                            className="flex items-center gap-1 rounded bg-red-500/20 border border-red-500/30 py-1 px-2.5 text-[10px] font-bold text-red-400 hover:bg-red-500/35 transition-colors"
                          >
                            <X size={10} />
                            Reject
                          </button>
                        </div>
                      )}

                      {/* Vote Buttons (Upvote/Downvote block) - hidden for admins */}
                      {!isAdmin && (
                      <div className="flex items-center gap-1 bg-surface rounded-lg p-1 border border-white/5">
                        <button
                          onClick={() => handleVote(ans._id, "upvote")}
                          className={`p-1 rounded transition-colors ${
                            hasUpvoted 
                              ? "text-emerald-400 bg-emerald-500/10" 
                              : "text-gray-500 hover:text-white"
                          }`}
                          title="Upvote"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <span className={`text-xs font-bold px-1 min-w-[14px] text-center ${
                          (ans.reputationScore ?? 0) > 0 
                            ? "text-emerald-400" 
                            : (ans.reputationScore ?? 0) < 0 
                            ? "text-red-400" 
                            : "text-gray-400"
                        }`}>
                          {ans.reputationScore ?? 0}
                        </span>
                        <button
                          onClick={() => handleVote(ans._id, "downvote")}
                          className={`p-1 rounded transition-colors ${
                            hasDownvoted 
                              ? "text-red-400 bg-red-500/10" 
                              : "text-gray-500 hover:text-white"
                          }`}
                          title="Downvote"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                      )}

                      {/* Mark Best button (Admin/Mod, if resolved question doesn't have it or toggling) */}
                      {isModeratorOrAdmin && !ans.isBestAnswer && (
                        <button
                          onClick={() => handleSelectBest(ans._id)}
                          className="flex items-center gap-1 rounded border border-emerald-500/20 bg-emerald-500/10 py-1 px-3 text-[10px] font-semibold text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                        >
                          <Check size={10} />
                          Mark Best
                        </button>
                      )}

                      {/* Report Answer (Any logged in user who isn't the author, author is not admin, and current user is not admin) */}
                      {currentUser && 
                       !isAdmin &&
                       currentUser._id !== ans.author?._id && 
                       ans.author?.role !== "admin" && (
                        <button
                          onClick={() => {
                            setReportTarget({ id: ans._id, type: "answer" });
                            setIsReportModalOpen(true);
                          }}
                          className={`flex items-center gap-1 rounded py-1 px-2.5 text-[10px] font-bold transition-colors border ${
                            reportedIds.has(ans._id)
                              ? "bg-gray-500/10 border-gray-500/20 text-gray-500 cursor-not-allowed opacity-50"
                              : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/25"
                          }`}
                          title={reportedIds.has(ans._id) ? "You have already reported this answer" : "Report Answer"}
                          disabled={reportedIds.has(ans._id)}
                        >
                          <ShieldAlert size={10} />
                          {reportedIds.has(ans._id) ? "Reported" : "Report"}
                        </button>
                      )}

                      {/* Edit & Delete (Author only, not admin viewing others' answers) */}
                      {currentUser?._id === ans.author?._id && !isAdmin && (
                        <div className="flex gap-1">
                          <button
                            onClick={() => {
                              setEditingAnswerId(ans._id);
                              setEditAnswerBody(ans.body);
                              setEditAnswerError("");
                            }}
                            className="p-1.5 text-gray-500 hover:text-white transition-colors"
                            title="Edit Answer"
                          >
                            <Edit size={12} />
                          </button>
                          <button
                            onClick={() => handleDeleteAnswer(ans._id)}
                            className="p-1.5 text-red-500/50 hover:text-red-400 transition-colors"
                            title="Delete Answer"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      )}

                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Answer Input Area */}
      <div className="rounded-2xl border border-white/5 bg-surface-light p-8 shadow-xl">
        <h4 className="text-base font-bold text-white mb-4">
          Contribute your Answer
        </h4>

        {submitError && (
          <div className={`mb-4 rounded-lg p-3 border text-xs ${
            submitError.startsWith("Success") 
              ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
              : "bg-red-500/10 border-red-500/20 text-red-400"
          }`}>
            {submitError}
          </div>
        )}

        <form onSubmit={handleAnswerSubmit} className="space-y-4">
          <textarea
            value={newAnswer}
            onChange={(e) => {
              setNewAnswer(e.target.value);
              setSubmitError("");
            }}
            required
            minLength={30}
            maxLength={2000}
            rows={4}
            placeholder="Provide a detailed, helpful answer containing verified resources or advice (minimum 30 characters)..."
            className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none resize-none"
          />
          
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-gray-500">
              {newAnswer.length}/2000 characters (min 30)
            </span>
            <button
              type="submit"
              disabled={submitting}
              className="flex items-center gap-1.5 rounded-lg bg-primary-500 py-2 px-4 text-xs font-semibold text-white hover:bg-primary-600 active:scale-95 transition-all duration-300 disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post Answer"}
              <Send size={12} />
            </button>
          </div>
        </form>
      </div>

      {/* Report Modal */}
      {isReportModalOpen && reportTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
          <div className="relative w-full max-w-md rounded-2xl border border-white/10 bg-surface-light p-6 shadow-2xl transition-all duration-300">
            
            {/* Close Button */}
            <button 
              onClick={() => setIsReportModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>

            {/* Header */}
            <div className="mb-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <ShieldAlert className="text-red-400" />
                Report Content
              </h3>
              <p className="mt-1 text-xs text-gray-400">
                Help us keep VicharanaShala safe and high quality. Tell us what is wrong with this {reportTarget.type}.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleReportSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                  Reason for Reporting
                </label>
                <select
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  required
                  className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-3 text-sm text-white focus:border-primary-500 focus:outline-none"
                >
                  <option value="spam" className="text-white bg-surface-light">Spam</option>
                  <option value="abuse" className="text-white bg-surface-light">Abuse / Harassment</option>
                  <option value="misinformation" className="text-white bg-surface-light">Misinformation</option>
                  <option value="irrelevant" className="text-white bg-surface-light">Irrelevant Content</option>
                  <option value="outdated" className="text-white bg-surface-light">Outdated Content</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">
                  Optional Details
                </label>
                <textarea
                  value={reportDesc}
                  onChange={(e) => setReportDesc(e.target.value)}
                  rows={4}
                  placeholder="Provide additional details or context about why you are reporting this content..."
                  className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsReportModalOpen(false)}
                  className="flex-1 rounded-lg border border-white/10 bg-surface hover:bg-surface-lighter py-2 px-4 text-xs font-semibold text-white transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReport}
                  className="flex-[2] rounded-lg bg-red-500 hover:bg-red-600 py-2 px-4 text-xs font-semibold text-white transition-all duration-300 disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {submittingReport ? "Submitting..." : "Submit Report"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default QuestionDetail;
