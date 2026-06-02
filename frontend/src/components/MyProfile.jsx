import { useState, useEffect } from "react";
import { 
  Home as HomeIcon, MessageSquare, Folder, PlusCircle, FileText, 
  Clock, CheckCircle, XCircle, Settings, Headphones, ChevronDown, Wrench, 
  Award, Shield, Mail, Calendar, ChevronRight, Eye, Check, X, 
  AlertTriangle, Save, Loader2, Send, ArrowLeft, GraduationCap,
  Flame, Sun, Bookmark, Edit3, Bell, User as UserIcon, Trash,
  UserPlus, DollarSign, BookOpen, Briefcase, Building, Cpu, Heart,
  Library, Compass, Globe, Search, Zap, ShieldCheck, HelpCircle, ArrowRight, ThumbsUp, ThumbsDown, ShieldAlert, Activity,
  Laptop, Bot, Users, Notebook
} from "lucide-react";
import api from "../api/axios";
import UserManagement from "./UserManagement";
import CategoryManagement from "./CategoryManagement";

const categoryMap = {
  technical: "Technical Issue",
  login: "Login Issue",
  other: "Other"
};

const categoryDescriptions = {
  "About the Internship": "Learn what VINS is, who can apply, internship phases, eligibility, and important participation rules.",
  "Timing & Dates": "Understand internship duration, start-date flexibility, exam-related policies, and key deadlines.",
  "NOC (No Objection Certificate)": "Everything about obtaining, submitting, verifying, and troubleshooting your NOC requirements.",
  "Selection, Offer Letter & Certificate": "Check selection status, accept offers correctly, manage dates, and understand certification policies.",
  "Work, Mentorship & Projects": "Explore project domains, daily expectations, mentor assignments, tools, and work structure.",
  "Communication & Code of Conduct": "Official communication channels, escalation methods, and important conduct guidelines.",
  "Interview Related": "Solutions for interview completion, dashboard status, and interview-related issues.",
  "Certificate": "Details about certificates, verification, internship credit, recommendations, and delivery format.",
  "Rosetta Journal": "Learn about the daily reflection journal, submission process, and completion requirements.",
  "Phase 1: Coursework & Live Sessions": "Information on mandatory courses, exemptions, registrations, and live learning sessions.",
  "Yaksha Chat": "Help with accessing and using the Yaksha support and guidance system.",
  "ViBe Platform": "Login help, course access, troubleshooting, proctoring rules, progress tracking, and platform usage.",
  "Team Formation": "Team creation rules, project allocation, collaboration guidelines, and mentor assignment process."
};

const statusMap = {
  open: "Open",
  in_progress: "In Progress",
  resolved: "Resolved"
};

const MyProfile = ({ currentUser, onBack, onQuestionClick, onAskClick, initialTab, onCategorySelect, onProfileUpdate }) => {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState(
    currentUser?.role === "superadmin" ? "users" : 
    currentUser?.role === "admin" ? "pending" : "home"
  );

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);
  
  // Sub-view data states
  const [categories, setCategories] = useState([]);
  const [allFaqs, setAllFaqs] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [userAnswers, setUserAnswers] = useState([]);
  const [submissionsSubTab, setSubmissionsSubTab] = useState("questions");
  const [approvedList, setApprovedList] = useState([]);
  const [approvedAnswersList, setApprovedAnswersList] = useState([]);
  const [rejectedList, setRejectedList] = useState([]);
  const [rejectedAnswersList, setRejectedAnswersList] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [flaggedQueue, setFlaggedQueue] = useState([]);
  const [answeredQueue, setAnsweredQueue] = useState([]);
  const [popularQuestions, setPopularQuestions] = useState([]);
  const [newQuestions, setNewQuestions] = useState([]);
  const [savedQuestions, setSavedQuestions] = useState([]);
  const [drafts, setDrafts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ faqs: [], questions: [] });
  const [isSearching, setIsSearching] = useState(false);

  const [loadingData, setLoadingData] = useState(false);
  const [cohortData, setCohortData] = useState(null);

  const handleHelpfulVoteLocal = async (e, qId) => {
    e.stopPropagation();
    try {
      const response = await api.patch(`/questions/${qId}/helpful`);
      if (response.data.success) {
        setCohortData(prev => {
          if (!prev) return prev;
          
          const updateList = (list) => 
            list.map(q => {
              if (q._id === qId) {
                const hasVoted = response.data.data.hasVoted;
                let newVotes = q.helpfulVotes ? [...q.helpfulVotes] : [];
                if (hasVoted && !newVotes.includes(currentUser?._id)) {
                  newVotes.push(currentUser?._id);
                } else if (!hasVoted) {
                  newVotes = newVotes.filter(id => id !== currentUser?._id);
                }
                return {
                  ...q,
                  helpfulVotes: newVotes,
                  helpfulVotesCount: response.data.data.helpfulVotesCount
                };
              }
              return q;
            });
            
          return {
            ...prev,
            trendingFAQs: updateList(prev.trendingFAQs),
            risingIssues: updateList(prev.risingIssues).sort((a, b) => (b.helpfulVotesCount || 0) - (a.helpfulVotesCount || 0)),
            resolvedNotices: updateList(prev.resolvedNotices)
          };
        });
      }
    } catch (err) {
      console.error("Failed to toggle helpful vote:", err);
    }
  };
  const [actionMessage, setActionMessage] = useState("");

  // Form states
  const [updateName, setUpdateName] = useState("");
  const [updateUsername, setUpdateUsername] = useState("");
  const [updateMetadata, setUpdateMetadata] = useState({
    department: "",
    staffId: "",
    authTier: "Level 1"
  });
  const [savingSettings, setSavingSettings] = useState(false);
  const [toast, setToast] = useState(null);

  // Report Modal states
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const [reportTarget, setReportTarget] = useState(null); // { id, type }
  const [reportReason, setReportReason] = useState("spam");
  const [reportDesc, setReportDesc] = useState("");
  const [submittingReport, setSubmittingReport] = useState(false);
  const [reportedIds, setReportedIds] = useState(new Set()); // IDs already reported by the user

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Ticket form states
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [ticketCategory, setTicketCategory] = useState("other");
  const [ticketAttachment, setTicketAttachment] = useState(null);
  const [selectedTicketId, setSelectedTicketId] = useState(null);
  const [selectedTicketData, setSelectedTicketData] = useState(null);
  const [newReplyText, setNewReplyText] = useState("");
  const [submittingReply, setSubmittingReply] = useState(false);
  const [updatingTicketStatus, setUpdatingTicketStatus] = useState(false);
  const [submittingTicket, setSubmittingTicket] = useState(false);
  const [staffList, setStaffList] = useState([]);

  const isStudent = currentUser?.role === "user";
  const isAdmin = currentUser?.role === "admin" || currentUser?.role === "superadmin";
  const isSuperadmin = currentUser?.role === "superadmin";

  const fetchMyReports = async () => {
    try {
      const response = await api.get("/reports/my");
      if (response.data.success) {
        setReportedIds(new Set(response.data.data.map(r => r.targetId)));
      }
    } catch (error) {
      console.error("Error fetching user reports:", error);
    }
  };

  useEffect(() => {
    if (currentUser?._id) {
      fetchUserProfile();
      fetchNotifications();
      fetchMyReports();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?._id) {
      loadTabContent();
    }
  }, [currentUser, activeTab]);

  useEffect(() => {
    setSelectedTicketId(null);
    setSelectedTicketData(null);
  }, [activeTab]);

  // ── Hero Search Logic ───────────────────────────────────────
  useEffect(() => {
    const performSearch = async () => {
      if (!searchQuery.trim()) {
        setSearchResults({ faqs: [], questions: [] });
        return;
      }
      setIsSearching(true);
      try {
        const response = await api.get(`/search?q=${encodeURIComponent(searchQuery)}`);
        if (response.data.success) {
          setSearchResults(response.data.data || { faqs: [], questions: [] });
        }
      } catch (error) {
        console.error("Search error:", error);
      } finally {
        setIsSearching(false);
      }
    };
    const timer = setTimeout(performSearch, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // ── Category icon/color meta ────────────────────────────────
  const getCategoryMeta = (index) => {
    const meta = [
      { icon: UserPlus, colorClass: "text-primary-400 bg-primary-500/10 border-primary-500/20" }, // About the internship
      { icon: Clock, colorClass: "text-primary-400 bg-primary-500/10 border-primary-500/20" },    // Timing and dates
      { icon: BookOpen, colorClass: "text-primary-400 bg-primary-500/10 border-primary-500/20" }, // NOC (No Objection Certificate)
      { icon: FileText, colorClass: "text-primary-400 bg-primary-500/10 border-primary-500/20" }, // Selection, offer letter, and certificate
      { icon: Briefcase, colorClass: "text-primary-400 bg-primary-500/10 border-primary-500/20" }, // Work, mentorship, and projects
      { icon: Globe, colorClass: "text-primary-400 bg-primary-500/10 border-primary-500/20" },    // Code of conduct — communication channels
      { icon: Building, colorClass: "text-primary-400 bg-primary-500/10 border-primary-500/20" }, // Interviews Related
      { icon: Award, colorClass: "text-primary-400 bg-primary-500/10 border-primary-500/20" },    // Certificate
      { icon: Notebook, colorClass: "text-primary-400 bg-primary-500/10 border-primary-500/20" }, // Rosetta — your internship journal
      { icon: Laptop, colorClass: "text-primary-400 bg-primary-500/10 border-primary-500/20" },   // Phase 1 — coursework, Vibe LMS, and live sessions
      { icon: Bot, colorClass: "text-primary-400 bg-primary-500/10 border-primary-500/20" },      // Yaksha Chat Related
      { icon: Compass, colorClass: "text-primary-400 bg-primary-500/10 border-primary-500/20" },  // ViBe Platform
      { icon: Users, colorClass: "text-primary-400 bg-primary-500/10 border-primary-500/20" }     // Team Formation
    ];
    return meta[index % meta.length];
  };

  const fetchUserProfile = async () => {
    try {
      const response = await api.get(`/users/${currentUser._id}/profile`);
      if (response.data.success) {
        const uProfile = response.data.data;
        setProfile(uProfile);
        setUpdateName(uProfile.name || uProfile.username);
        setUpdateUsername(uProfile.username || "");
        setUpdateMetadata({
          department: uProfile.profileMetadata?.department || "",
          staffId: uProfile.profileMetadata?.staffId || "",
          authTier: uProfile.profileMetadata?.authTier || "Level 1"
        });
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
    } finally {
      setLoadingProfile(false);
    }
  };

  const fetchStudentQuestions = async () => {
    setLoadingData(true);
    try {
      const response = await api.get(`/users/${currentUser._id}/questions`);
      if (response.data.success) {
        setSubmissions(response.data.data || []);
      }
    } catch (error) {
      console.error("Error fetching user questions:", error);
    } finally {
      setLoadingData(false);
    }
  };

  const toggleSaveFAQ = async (q) => {
    try {
      const response = await api.post("/bookmarks/toggle", { questionId: q._id });
      if (response.data.success) {
        setActionMessage(response.data.message);
        // Refresh bookmarks list
        const listRes = await api.get("/bookmarks");
        if (listRes.data.success) {
          setSavedQuestions(listRes.data.data || []);
        }
      }
    } catch (error) {
      console.error("Error toggling save:", error);
      setActionMessage("Error toggling bookmark status.");
    }
  };

  const loadDrafts = () => {
    const saved = localStorage.getItem(`drafts_${currentUser._id}`);
    return saved ? JSON.parse(saved) : [];
  };

  const deleteDraft = (draftId) => {
    const draftsList = loadDrafts();
    const updated = draftsList.filter(item => item._id !== draftId);
    localStorage.setItem(`drafts_${currentUser._id}`, JSON.stringify(updated));
    if (activeTab === "drafts") {
      setDrafts(updated);
    }
    setActionMessage("Draft deleted.");
  };

  const fetchNotifications = async () => {
    try {
      const response = await api.get("/notifications");
      if (response.data.success) {
        const list = response.data.data || [];
        setNotifications(list);
        setUnreadNotificationsCount(list.filter(n => !n.isRead).length);
      }
    } catch (error) {
      console.error("Error fetching notifications:", error);
    }
  };

  const handleNotificationRead = async (id) => {
    try {
      const response = await api.patch(`/notifications/${id}/read`);
      if (response.data.success) {
        fetchNotifications();
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  const handleAllNotificationsRead = async () => {
    try {
      const response = await api.patch("/notifications/read-all");
      if (response.data.success) {
        fetchNotifications();
        setActionMessage("All notifications marked as read.");
      }
    } catch (error) {
      console.error("Error marking all notifications as read:", error);
    }
  };

  const handleNotificationDelete = async (id) => {
    try {
      const response = await api.delete(`/notifications/${id}`);
      if (response.status === 204 || response.data?.success) {
        fetchNotifications();
        setActionMessage("Notification deleted.");
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  const loadTabContent = async () => {
    setLoadingData(true);
    setActionMessage("");
    try {
      if (activeTab === "home") {
        // Load categories, user submissions, and featured questions
        const catRes = await api.get("/categories");
        const subRes = await api.get(`/users/${currentUser._id}/questions`);
        const popRes = await api.get("/questions?sort=mostViewed");
        const newRes = await api.get("/questions?sort=newest");
        if (catRes.data.success) setCategories(catRes.data.data || []);
        if (subRes.data.success) setSubmissions(subRes.data.data || []);
        if (popRes.data.success) setPopularQuestions(popRes.data.data || []);
        if (newRes.data.success) setNewQuestions(newRes.data.data || []);
      } else if (activeTab === "pending") {
        // Fetch flagged queue and answered questions queue
        const flaggedRes = await api.get("/moderation/queue");
        const answeredRes = await api.get("/moderation/queue/answered");
        if (flaggedRes.data.success) setFlaggedQueue(flaggedRes.data.data || []);
        if (answeredRes.data.success) setAnsweredQueue(answeredRes.data.data || []);
      } else if (activeTab === "all-faqs") {
        // Fetch all official FAQs
        const response = await api.get("/questions/faqs");
        if (response.data.success) setAllFaqs(response.data.data || []);
      } else if (activeTab === "categories") {
        // Fetch categories list
        const response = await api.get("/categories");
        if (response.data.success) setCategories(response.data.data || []);
      } else if (activeTab === "submissions") {
        // Fetch submissions by this user
        const qResponse = await api.get(`/users/${currentUser._id}/questions`);
        const aResponse = await api.get(`/users/${currentUser._id}/answers`);
        if (qResponse.data.success) setSubmissions(qResponse.data.data || []);
        if (aResponse.data.success) setUserAnswers(qResponse.data.data || []);
      } else if (activeTab === "approved") {
        // Fetch resolved/approved FAQs
        const response = await api.get("/moderation/queue/resolved");
        const answersRes = await api.get("/moderation/queue/approved-answers");
        if (response.data.success) setApprovedList(response.data.data || []);
        if (answersRes.data.success) setApprovedAnswersList(answersRes.data.data || []);
      } else if (activeTab === "rejected") {
        // Fetch rejected items
        // Standard endpoint: we query all questions with status 'deleted' or moderationStatus 'rejected'
        const response = await api.get("/questions?status=deleted");
        const answersRes = await api.get("/moderation/queue/rejected-answers");
        if (response.data.success) setRejectedList(response.data.data || []);
        if (answersRes.data.success) setRejectedAnswersList(answersRes.data.data || []);
      } else if (activeTab === "support") {
        // Fetch support tickets
        const response = await api.get("/tickets");
        if (response.data.success) setTickets(response.data.data || []);
        if (!isStudent) {
          const staffRes = await api.get("/users/staff");
          if (staffRes.data.success) setStaffList(staffRes.data.data || []);
        }
      } else if (activeTab === "popular") {
        const response = await api.get("/questions?sort=mostUpvoted");
        if (response.data.success) setPopularQuestions(response.data.data || []);
      } else if (activeTab === "whats-new") {
        const response = await api.get("/questions?status=pending,open,unresolved&sort=helpful");
        if (response.data.success) setNewQuestions(response.data.data || []);
      } else if (activeTab === "saved-faqs") {
        const response = await api.get("/bookmarks");
        if (response.data.success) {
          setSavedQuestions(response.data.data || []);
        }
      } else if (activeTab === "drafts") {
        setDrafts(loadDrafts());
      } else if (activeTab === "notifications") {
        await fetchNotifications();
      } else if (activeTab === "cohort-pulse") {
        const response = await api.get("/cohort-pulse");
        if (response.data.success) {
          setCohortData(response.data.data);
        }
      }
    } catch (error) {
      console.error(`Error loading tab content for ${activeTab}:`, error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleHelpfulVote = async (e, qId) => {
    e.stopPropagation();
    try {
      const response = await api.patch(`/questions/${qId}/helpful`);
      if (response.data.success) {
        const updateQuestionList = (list) => 
          list.map(q => {
            if (q._id === qId) {
              const hasVoted = response.data.data.hasVoted;
              let newVotes = q.helpfulVotes ? [...q.helpfulVotes] : [];
              if (hasVoted && !newVotes.includes(currentUser?._id)) {
                newVotes.push(currentUser?._id);
              } else if (!hasVoted) {
                newVotes = newVotes.filter(id => id !== currentUser?._id);
              }
              return {
                ...q,
                helpfulVotes: newVotes,
                helpfulVotesCount: response.data.data.helpfulVotesCount
              };
            }
            return q;
          });

        setNewQuestions(prev => updateQuestionList(prev).sort((a, b) => (b.helpfulVotesCount || 0) - (a.helpfulVotesCount || 0)));
        setPopularQuestions(prev => updateQuestionList(prev));
      }
    } catch (err) {
      console.error("Failed to toggle helpful vote:", err);
    }
  };

  const handleAnswerDownvote = async (e, questionId, answerId) => {
    e.stopPropagation();
    if (!currentUser) {
      return;
    }
    try {
      const response = await api.post(`/questions/${questionId}/answers/${answerId}/downvote`);
      if (response.data.success) {
        setPopularQuestions(prev => prev.map(q => {
          if (q.linkedBestAnswerId?._id === answerId) {
            return {
              ...q,
              linkedBestAnswerId: {
                ...q.linkedBestAnswerId,
                upvotes: response.data.data.upvotes || q.linkedBestAnswerId.upvotes,
                downvotes: response.data.data.downvotes || q.linkedBestAnswerId.downvotes,
                upvoteCount: response.data.data.upvoteCount ?? q.linkedBestAnswerId.upvoteCount,
                reputationScore: response.data.data.reputationScore ?? q.linkedBestAnswerId.reputationScore
              }
            };
          }
          return q;
        }));
        setToast({ message: "Downvote updated successfully", type: "success" });
      }
    } catch (err) {
      console.error("Failed to toggle downvote on answer:", err);
      setToast({ message: err.response?.data?.error?.message || "Failed to update downvote.", type: "error" });
    }
  };

  const handleReportSubmit = async (e) => {
    e.preventDefault();
    if (!currentUser) {
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
        setToast({ message: `Thank you! The ${reportTarget.type} has been reported.`, type: "success" });
        setReportedIds(prev => new Set(prev).add(reportTarget.id));
        setIsReportModalOpen(false);
        setReportDesc("");
        setReportReason("spam");
      }
    } catch (error) {
      console.error("Error reporting content:", error);
      setToast({ message: error.response?.data?.error?.message || "Failed to submit report.", type: "error" });
    } finally {
      setSubmittingReport(false);
    }
  };


  const handleModerationAction = async (targetId, action, questionId = null) => {
    setActionMessage("");
    try {
      let response;
      if (action === 'mark_best') {
        response = await api.patch(`/questions/${questionId}/answers/${targetId}/best`);
      } else {
        response = await api.patch(`/moderation/${targetId}/${action}`);
      }

      if (response.data.success) {
        let label = "";
        if (action === 'reject') {
          label = 'Content rejected successfully.';
        } else if (action === 'approve') {
          label = 'Content approved successfully.';
        } else if (action === 'mark_best') {
          label = 'Answer approved and marked as the best answer successfully.';
        } else {
          label = `Successfully executed ${action} action.`;
        }
        setActionMessage(label);
        loadTabContent(); // Refresh queue lists
      }
    } catch (error) {
      console.error(error);
      setActionMessage(`Error: ${error.response?.data?.error?.message || "Operation failed."}`);
    }
  };

  const handleSettingsSave = async (e) => {
    e.preventDefault();
    setSavingSettings(true);
    setActionMessage("");

    try {
      const response = await api.patch("/users/me", {
        name: updateName,
        username: updateUsername
      });

      if (response.data.success) {
        setProfile(prev => ({
          ...prev,
          name: response.data.data.name,
          username: response.data.data.username
        }));
        setActionMessage("Settings updated successfully!");
        setToast({ message: "your profile is saved", type: "success" });
        if (onProfileUpdate) {
          onProfileUpdate(response.data.data);
        }
      }
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.error?.message || "Error saving settings.";
      setActionMessage(errMsg);
      setToast({ message: errMsg, type: "error" });
    } finally {
      setSavingSettings(false);
    }
  };

  const fetchTicketDetails = async (ticketId) => {
    try {
      const response = await api.get(`/tickets/${ticketId}`);
      if (response.data.success) {
        setSelectedTicketData(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching ticket details:", error);
      alert("Failed to load ticket details.");
    }
  };

  const handleTicketClick = (ticketId) => {
    setSelectedTicketId(ticketId);
    fetchTicketDetails(ticketId);
  };

  const handleTicketSubmit = async (e) => {
    e.preventDefault();
    if (ticketTitle.trim().length < 5 || ticketDesc.trim().length < 20) {
      alert("Please check minimum lengths: Title (min 5), Description (min 20).");
      return;
    }

    setSubmittingTicket(true);
    try {
      const response = await api.post("/tickets", {
        title: ticketTitle,
        description: ticketDesc,
        category: ticketCategory
      });
      if (response.data.success) {
        const ticket = response.data.data;
        if (ticketAttachment) {
          const formData = new FormData();
          formData.append("file", ticketAttachment);
          try {
            await api.post(`/tickets/${ticket._id}/attachments`, formData, {
              headers: {
                "Content-Type": "multipart/form-data"
              }
            });
          } catch (uploadError) {
            console.error("Error uploading attachment:", uploadError);
            alert("Ticket created, but attachment upload failed.");
          }
        }
        setTicketTitle("");
        setTicketDesc("");
        setTicketCategory("other");
        setTicketAttachment(null);
        
        // Reset file input
        const fileInput = document.getElementById("ticket-file-input");
        if (fileInput) fileInput.value = "";

        setActionMessage("Support ticket opened successfully!");
        
        // Refresh ticket list
        const ticketsResponse = await api.get("/tickets");
        if (ticketsResponse.data.success) {
          setTickets(ticketsResponse.data.data || []);
        }
      }
    } catch (error) {
      console.error(error);
      alert("Failed to submit support ticket.");
    } finally {
      setSubmittingTicket(false);
    }
  };

  const handleReplySubmit = async (e) => {
    e.preventDefault();
    if (!newReplyText.trim()) return;

    setSubmittingReply(true);
    try {
      const response = await api.post(`/tickets/${selectedTicketId}/messages`, {
        body: newReplyText
      });
      if (response.data.success) {
        setNewReplyText("");
        await fetchTicketDetails(selectedTicketId);
      }
    } catch (error) {
      console.error("Error submitting reply:", error);
      alert("Failed to send reply.");
    } finally {
      setSubmittingReply(false);
    }
  };

  const handleUpdateStatus = async (status) => {
    setUpdatingTicketStatus(true);
    try {
      const response = await api.patch(`/tickets/${selectedTicketId}/status`, { status });
      if (response.data.success) {
        setActionMessage(`Ticket status updated to ${status}`);
        await fetchTicketDetails(selectedTicketId);
        // Refresh list
        const ticketsResponse = await api.get("/tickets");
        if (ticketsResponse.data.success) {
          setTickets(ticketsResponse.data.data || []);
        }
      }
    } catch (error) {
      console.error("Error updating status:", error);
      alert("Failed to update status.");
    } finally {
      setUpdatingTicketStatus(false);
    }
  };

  const handleAssignTicket = async (staffId) => {
    try {
      const response = await api.patch(`/tickets/${selectedTicketId}/assign`, {
        assignedTo: staffId
      });
      if (response.data.success) {
        setActionMessage("Ticket assigned successfully");
        await fetchTicketDetails(selectedTicketId);
        // Refresh list
        const ticketsResponse = await api.get("/tickets");
        if (ticketsResponse.data.success) {
          setTickets(ticketsResponse.data.data || []);
        }
      }
    } catch (error) {
      console.error("Error assigning ticket:", error);
      alert("Failed to assign ticket.");
    }
  };

  if (loadingProfile) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="h-10 w-10 animate-spin text-primary-500" />
        <p className="mt-4 text-sm text-gray-400">Retrieving profile...</p>
      </div>
    );
  }

  // Points Calculation for Student Dashboard
  const stats = profile?.stats || { questionsAsked: 0, answersGiven: 0, bestAnswers: 0, upvotesReceived: 0 };
  const contributionPoints = (stats.questionsAsked * 5) + (stats.answersGiven * 10) + (stats.bestAnswers * 20);

  // Total pending reviews count for pill badge (Flagged reports + answered questions with pending responses)
  const pendingCount = flaggedQueue.length + answeredQueue.length;

  const isAssignee = selectedTicketData?.ticket?.assignedTo?._id === currentUser?._id;
  const isUnassigned = !selectedTicketData?.ticket?.assignedTo;

  // Render Sidebar Layout for Admin / Student
  return (
    <div className="flex bg-surface h-[calc(100vh-73px)] text-white overflow-hidden">
      
      {/* ---------------------------------------------------- */}
      {/* LEFT SIDEBAR NAVIGATION PANEL                        */}
      {/* ---------------------------------------------------- */}
      <aside className="w-64 shrink-0 border-r border-white/10 bg-surface-dark flex flex-col justify-between p-5 select-none font-sans overflow-y-auto">
        <div className="space-y-7">
          
          {/* Logo / Brand Header */}
          <div className="flex items-center gap-2.5 px-2">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-primary-500 to-indigo-600 text-sm font-bold text-white shadow-lg shadow-primary-500/20">
              ?
            </span>
            <span className="text-base font-bold tracking-tight text-white">
              FAQ Portal
            </span>
          </div>

          {/* ADMIN SIDEBAR */}
          {isAdmin && (
            <div className="space-y-6">
              <nav className="space-y-1">
                <button
                  onClick={onBack}
                  className="flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <HomeIcon size={18} className="text-gray-400" />
                  Home
                </button>
                
                <button
                  onClick={() => setActiveTab("all-faqs")}
                  className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "all-faqs"
                      ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <MessageSquare size={18} className={activeTab === "all-faqs" ? "text-blue-400" : "text-gray-400"} />
                  All FAQs
                </button>



                <button
                  onClick={onAskClick}
                  className="flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <PlusCircle size={18} className="text-gray-400" />
                  Submit FAQ
                </button>

                <button
                  onClick={() => setActiveTab("submissions")}
                  className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "submissions"
                      ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <FileText size={18} className={activeTab === "submissions" ? "text-blue-400" : "text-gray-400"} />
                  My Submissions
                </button>
              </nav>

              <div className="border-t border-white/5 my-4" />

              <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 px-3.5 mb-2">
                  Admin / Reviewer
                </span>

                {isSuperadmin && (
                  <button
                    onClick={() => setActiveTab("users")}
                    className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      activeTab === "users"
                        ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Shield size={18} className={activeTab === "users" ? "text-blue-400" : "text-gray-400"} />
                    User Management
                  </button>
                )}

                {isAdmin && (
                  <button
                    onClick={() => setActiveTab("categories")}
                    className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                      activeTab === "categories"
                        ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                        : "text-gray-300 hover:text-white hover:bg-white/5"
                    }`}
                  >
                    <Folder size={18} className={activeTab === "categories" ? "text-blue-400" : "text-gray-400"} />
                    Categories
                  </button>
                )}

                <button
                  onClick={() => setActiveTab("pending")}
                  className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "pending"
                      ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Clock size={18} className={activeTab === "pending" ? "text-blue-400" : "text-gray-400"} />
                  Pending Reviews
                  {pendingCount > 0 && (
                    <span className="ml-auto bg-blue-900/60 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                      {pendingCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("approved")}
                  className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "approved"
                      ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <CheckCircle size={18} className={activeTab === "approved" ? "text-blue-400" : "text-gray-400"} />
                  Approved FAQs
                </button>

                <button
                  onClick={() => setActiveTab("rejected")}
                  className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "rejected"
                      ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <XCircle size={18} className={activeTab === "rejected" ? "text-blue-400" : "text-gray-400"} />
                  Rejected FAQs
                </button>
              </div>
            </div>
          )}

          {/* STUDENT SIDEBAR (as in user dashboard mockup image) */}
          {isStudent && (
            <div className="space-y-5">
              
              {/* Group: MAIN */}
              <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 px-3.5 mb-1.5">
                  Main
                </span>
                
                <button
                  onClick={() => setActiveTab("home")}
                  className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "home"
                      ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <HomeIcon size={16} className={activeTab === "home" ? "text-blue-400" : "text-gray-400"} />
                  Home
                </button>

                <button
                  onClick={() => setActiveTab("popular")}
                  className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "popular"
                      ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Flame size={16} className={activeTab === "popular" ? "text-blue-400" : "text-gray-400"} />
                  Popular
                </button>

                <button
                  onClick={() => setActiveTab("whats-new")}
                  className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "whats-new"
                      ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Sun size={16} className={activeTab === "whats-new" ? "text-blue-400" : "text-gray-400"} />
                  What's New
                </button>

                <button
                  onClick={() => setActiveTab("cohort-pulse")}
                  className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "cohort-pulse"
                      ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Activity size={16} className={activeTab === "cohort-pulse" ? "text-blue-400" : "text-gray-400"} />
                  Cohort Pulse
                </button>

                <button
                  onClick={() => setActiveTab("saved-faqs")}
                  className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "saved-faqs"
                      ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Bookmark size={16} className={activeTab === "saved-faqs" ? "text-blue-400" : "text-gray-400"} />
                  Saved FAQs
                </button>
              </div>

              {/* Group: CONTRIBUTE */}
              <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 px-3.5 mb-1.5">
                  Contribute
                </span>
                
                <button
                  onClick={() => onAskClick()}
                  className="flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold text-gray-300 hover:text-white hover:bg-white/5 transition-all duration-200"
                >
                  <PlusCircle size={16} className="text-gray-400" />
                  Submit FAQ
                </button>

                <button
                  onClick={() => setActiveTab("submissions")}
                  className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "submissions"
                      ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <FileText size={16} className={activeTab === "submissions" ? "text-blue-400" : "text-gray-400"} />
                  My Submissions
                </button>

                <button
                  onClick={() => setActiveTab("drafts")}
                  className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "drafts"
                      ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Edit3 size={16} className={activeTab === "drafts" ? "text-blue-400" : "text-gray-400"} />
                  Drafts
                </button>
              </div>

              {/* Group: COMMUNITY */}
              <div className="space-y-1">
                <span className="block text-[10px] font-bold uppercase tracking-wider text-gray-500 px-3.5 mb-1.5">
                  Community
                </span>

                <button
                  onClick={() => setActiveTab("settings")}
                  className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "settings"
                      ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <UserIcon size={16} className={activeTab === "settings" ? "text-blue-400" : "text-gray-400"} />
                  My Profile
                </button>

                <button
                  onClick={() => setActiveTab("notifications")}
                  className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "notifications"
                      ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Bell size={16} className={activeTab === "notifications" ? "text-blue-400" : "text-gray-400"} />
                  Notifications
                  {unreadNotificationsCount > 0 && (
                    <span className="ml-auto bg-blue-900/60 text-blue-300 text-[10px] font-bold px-2 py-0.5 rounded-full border border-blue-500/20">
                      {unreadNotificationsCount}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => setActiveTab("support")}
                  className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "support"
                      ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Wrench size={16} className={activeTab === "support" ? "text-blue-400" : "text-gray-400"} />
                  Troubleshooting
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Bottom Panel Actions & User Profile Block */}
        <div className="space-y-4">
          {isAdmin && (
            <nav className="space-y-1">
              <button
                onClick={() => setActiveTab("settings")}
                className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  activeTab === "settings"
                    ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Settings size={18} className={activeTab === "settings" ? "text-blue-400" : "text-gray-400"} />
                Settings
              </button>

              <button
                onClick={() => setActiveTab("support")}
                className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  activeTab === "support"
                    ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                    : "text-gray-300 hover:text-white hover:bg-white/5"
                }`}
              >
                <Wrench size={18} className={activeTab === "support" ? "text-blue-400" : "text-gray-400"} />
                Troubleshooting
              </button>
            </nav>
          )}

          {/* User profile details block */}
          <div 
            onClick={() => setActiveTab("settings")}
            className="flex items-center gap-3 p-2.5 rounded-xl border border-white/5 bg-surface hover:bg-surface-light cursor-pointer transition-colors"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-500/15 text-primary-400 border border-primary-500/20 text-xs font-bold uppercase">
              {profile?.name?.substring(0, 2) || profile?.username?.substring(0, 2) || "JD"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-bold text-white truncate">{profile?.name || profile?.username}</p>
              <p className="text-[10px] text-gray-500 truncate">{currentUser?.role === 'admin' ? 'Reviewer' : 'Student'}</p>
            </div>
            <ChevronDown size={14} className="text-gray-500" />
          </div>
        </div>
      </aside>

      {/* ---------------------------------------------------- */}
      {/* RIGHT-HAND WORKSPACE PANEL                           */}
      {/* ---------------------------------------------------- */}
      <main className="flex-1 p-8 overflow-y-auto bg-surface">
        
        {/* Dynamic Status / Response message */}
        {actionMessage && (
          <div className={`mb-6 p-3.5 rounded-lg text-xs font-semibold border flex justify-between items-center ${
            actionMessage.startsWith("Error") 
              ? "bg-red-500/10 border-red-500/20 text-red-400"
              : "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
          }`}>
            <span>{actionMessage}</span>
            <button onClick={() => setActionMessage("")} className="text-gray-400 hover:text-white">
              <X size={14} />
            </button>
          </div>
        )}

        {/* LOADING STATE INDICATION */}
        {loadingData ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
            <p className="mt-3 text-xs text-gray-500">Retrieving tab data...</p>
          </div>
        ) : (
          <>
            {/* USERS TAB */}
            {activeTab === "users" && isSuperadmin && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <UserManagement />
              </div>
            )}

            {/* CATEGORIES TAB */}
            {activeTab === "categories" && isAdmin && (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                <CategoryManagement />
              </div>
            )}

            {/* ── HOME TAB — Full FAQ Portal ─────────────────────────────────── */}
            {activeTab === "home" && (
              <div className="mx-auto max-w-6xl px-2">

                {/* ── Search Section ────────────────────────────────────────────── */}
                <section className="mb-10">
                  <div className="relative max-w-lg shadow-2xl rounded-xl">
                    <Search className="absolute top-4 left-4 h-5 w-5 text-gray-500" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Type keywords to search or filter categories..."
                      className="w-full rounded-xl border border-white/10 bg-surface-light py-3.5 pl-12 pr-16 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
                    />
                    <button className="absolute right-2 top-2 rounded-lg bg-primary-500 p-2 text-white hover:bg-primary-600 active:scale-95 transition-all duration-300">
                      <Search size={16} />
                    </button>
                  </div>
                </section>

                {/* ── Search Results or Browse ─────────────────────────────────── */}
                {searchQuery.trim() ? (
                  <section className="space-y-8">
                    <div className="flex justify-between items-center border-b border-white/5 pb-4">
                      <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase">Search Results</h3>
                    </div>

                    {isSearching ? (
                      <div className="flex flex-col items-center py-16">
                        <Loader2 className="h-8 w-8 animate-spin text-primary-500" />
                        <p className="mt-4 text-xs text-gray-500">Searching FAQ and question text index...</p>
                      </div>
                    ) : searchResults.faqs.length === 0 && searchResults.questions.length === 0 ? (
                      <div className="rounded-xl border border-white/5 bg-surface-light p-12 text-center">
                        <p className="text-gray-400 font-medium">No results found for "{searchQuery}"</p>
                        <p className="text-gray-600 text-xs mt-1">Check spelling or create a new question instead.</p>
                        <button onClick={() => onAskClick()} className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-primary-500 py-2 px-4 text-xs font-semibold text-white hover:bg-primary-600 transition-colors">
                          Submit Question
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-8">
                        {searchResults.faqs.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                              Verified FAQs
                            </h4>
                            <div className="space-y-2">
                              {searchResults.faqs.map((faq) => (
                                <div
                                  key={faq._id}
                                  onClick={() => onQuestionClick(faq)}
                                  className="group relative flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-2xl border border-indigo-500/10 bg-indigo-950/10 p-5 cursor-pointer hover:border-indigo-500/20 hover:bg-indigo-950/20 transition-all duration-300 gap-4"
                                >
                                  <div className="min-w-0 flex-1">
                                    <span className="inline-flex rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-2">Verified FAQ</span>
                                    <h4 className="text-base font-bold text-white group-hover:text-primary-300 truncate mb-1">{faq.title}</h4>
                                    <p className="text-[10px] text-gray-500">Category: {faq.category?.name} • Promoted on {new Date(faq.updatedAt).toLocaleDateString()}</p>
                                  </div>
                                  <div className="flex items-center gap-4 shrink-0 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><Eye size={12} />{faq.views}</span>
                                    <ArrowRight size={14} className="text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {searchResults.questions.length > 0 && (
                          <div className="space-y-3">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">Community Questions</h4>
                            <div className="space-y-2">
                              {searchResults.questions.map((q) => (
                                <div
                                  key={q._id}
                                  onClick={() => onQuestionClick(q)}
                                  className="group relative flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-2xl border border-white/5 bg-surface-light p-5 cursor-pointer hover:border-white/10 hover:bg-surface-lighter transition-all duration-300 gap-4"
                                >
                                  <div className="min-w-0 flex-1">
                                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-2 ${
                                      q.status === 'resolved' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                    }`}>{q.status}</span>
                                    <h4 className="text-base font-bold text-white group-hover:text-primary-300 truncate mb-1">{q.title}</h4>
                                    <p className="text-[10px] text-gray-500">Category: {q.category?.name} • Asked by {q.author?.name || q.author?.username} on {new Date(q.createdAt).toLocaleDateString()}</p>
                                  </div>
                                  <div className="flex items-center gap-4 shrink-0 text-xs text-gray-500">
                                    <span className="flex items-center gap-1"><Eye size={12} />{q.views}</span>
                                    <ArrowRight size={14} className="text-gray-400 transition-transform group-hover:translate-x-0.5" />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </section>
                ) : (
                  <>
                    {/* ── Category Grid ──────────────────────────────────────────── */}
                    <section className="mb-12">
                      <div className="flex justify-between items-center mb-6">
                        <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase">
                          Browse Category Portals ({categories.length})
                        </h3>
                      </div>

                      <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5" style={{ perspective: "1000px" }}>
                        {categories.map((cat, index) => {
                          const { icon: Icon, colorClass } = getCategoryMeta(index);
                          const formattedNumber = String(index + 1).padStart(2, "0");
                          return (
                            <div
                              key={cat._id}
                              onClick={() => onCategorySelect(cat)}
                              className="flip-card relative rounded-xl border border-white/5 bg-surface-light hover:border-primary-500/15 shadow-sm cursor-pointer"
                            >
                              {/* Front Face */}
                              <div className="absolute inset-0 flex flex-col justify-between p-4" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}>
                                <span className="absolute top-3 right-3 text-[10px] font-black text-white/10">{formattedNumber}</span>
                                <div>
                                  <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg border ${colorClass}`}>
                                    <Icon size={18} strokeWidth={2} />
                                  </div>
                                  <h4 className="text-sm font-extrabold text-gray-300 leading-tight">{cat.name}</h4>
                                </div>
                                <div className="flex items-center justify-between border-t border-white/5 pt-3">
                                  <span className="text-[10px] font-bold text-gray-400">{cat.questionCount || 0} solutions</span>
                                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-light/5 text-gray-400 shadow-sm">
                                    <ArrowRight size={12} />
                                  </div>
                                </div>
                              </div>
                              {/* Back Face */}
                              <div className="absolute inset-0 flex flex-col items-start justify-center p-4 rounded-xl bg-gradient-to-br from-[#034d33] to-[#023c27]" style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}>
                                <p className="text-xs font-medium text-gray-400 leading-relaxed line-clamp-5">{cat.description || categoryDescriptions[cat.name] || `Official FAQs for the section: ${cat.name}`}</p>
                                <div className="mt-4 flex items-center gap-1 text-[10px] font-semibold text-gray-400">
                                  <span>View FAQs</span>
                                  <ArrowRight size={12} />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </section>
                  </>
                )}
              </div>
            )}
            {/* POPULAR SUB-VIEW */}
            {activeTab === "popular" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Popular FAQs & Questions</h2>
                  <p className="text-xs text-gray-500">Browse highly viewed questions and deflection logs across the campus community.</p>
                </div>

                {popularQuestions.length === 0 ? (
                  <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl">
                    <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-12 text-center text-gray-500 font-sans">
                      No popular questions loaded.
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {popularQuestions.map((q) => {
                      const hasUpvoted = q.helpfulVotes?.includes(currentUser?._id);
                      const hasDownvoted = q.linkedBestAnswerId?.downvotes?.includes(currentUser?._id);
                      const isReported = reportedIds.has(q._id);

                      return (
                        <div 
                          key={q._id}
                          onClick={() => onQuestionClick(q)}
                          className="group relative flex flex-col justify-between rounded-2xl border border-white/5 bg-surface-light p-5 cursor-pointer hover:border-white/10 hover:bg-surface-lighter hover:shadow-xl transition-all duration-300 gap-4"
                        >
                          <div className="space-y-3">
                            {/* Card Header Info */}
                            <div className="flex justify-between items-center text-[10px] text-gray-500">
                              <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 font-bold uppercase">
                                🔥 Popular
                              </span>
                              <span>Category: {q.category?.name} • Views: {q.views || 0}</span>
                            </div>

                            {/* Question Title */}
                            <div>
                              <h4 className="text-base font-bold text-white group-hover:text-primary-300 leading-snug line-clamp-2">
                                {q.title}
                              </h4>
                              <p className="text-[10px] text-gray-500 mt-1">Asked on {new Date(q.createdAt).toLocaleDateString()}</p>
                            </div>

                            {/* Best Answer Block */}
                            {q.linkedBestAnswerId ? (
                              <div className="p-3.5 rounded-xl bg-emerald-500/5 border border-emerald-500/10 text-xs text-gray-300">
                                <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-400 uppercase tracking-wider mb-1.5">
                                  <Award size={12} className="shrink-0" />
                                  Best Answer
                                </div>
                                <p className="line-clamp-3 leading-relaxed whitespace-pre-wrap font-sans">
                                  {q.linkedBestAnswerId.body}
                                </p>
                              </div>
                            ) : (
                              <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs text-gray-500 italic font-sans">
                                Waiting for a verified solution...
                              </div>
                            )}
                          </div>

                          {/* Card Footer Actions */}
                          <div className="flex items-center justify-between border-t border-white/5 pt-3 mt-1 flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              {/* Upvote Button */}
                              <button
                                onClick={(e) => handleHelpfulVote(e, q._id)}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all duration-200 ${
                                  hasUpvoted
                                    ? "bg-primary-500/20 text-primary-400 border-primary-500/30"
                                    : "bg-surface border-white/5 text-gray-400 hover:text-white hover:border-white/10"
                                }`}
                                title={hasUpvoted ? "Remove upvote" : "Upvote question"}
                              >
                                <ThumbsUp size={12} className={hasUpvoted ? "fill-current" : ""} />
                                <span>{q.helpfulVotesCount || 0}</span>
                              </button>

                              {/* Downvote Button */}
                              <button
                                onClick={(e) => {
                                  if (q.linkedBestAnswerId) {
                                    handleAnswerDownvote(e, q._id, q.linkedBestAnswerId._id);
                                  } else {
                                    e.stopPropagation();
                                  }
                                }}
                                disabled={!q.linkedBestAnswerId}
                                className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all duration-200 ${
                                  !q.linkedBestAnswerId
                                    ? "opacity-30 cursor-not-allowed bg-surface border-white/5 text-gray-600"
                                    : hasDownvoted
                                    ? "bg-red-500/20 text-red-400 border-red-500/30"
                                    : "bg-surface border-white/5 text-gray-400 hover:text-white hover:border-white/10"
                                }`}
                                title={!q.linkedBestAnswerId ? "No answer to downvote" : hasDownvoted ? "Remove downvote" : "Downvote best answer"}
                              >
                                <ThumbsDown size={12} className={hasDownvoted ? "fill-current" : ""} />
                                <span>{q.linkedBestAnswerId?.downvotes?.length || 0}</span>
                              </button>
                            </div>

                            {/* Report Button */}
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setReportTarget({ id: q._id, type: "question" });
                                setIsReportModalOpen(true);
                              }}
                              disabled={isReported}
                              className={`flex items-center gap-1.5 rounded-lg py-1.5 px-3 text-[10px] font-bold transition-all duration-200 border ${
                                isReported
                                  ? "bg-gray-500/10 border-gray-500/20 text-gray-500 cursor-not-allowed opacity-50"
                                  : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20"
                              }`}
                              title={isReported ? "Already reported" : "Report question"}
                            >
                              <ShieldAlert size={12} />
                              {isReported ? "Reported" : "Report"}
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* WHATS NEW SUB-VIEW */}
            {activeTab === "whats-new" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Open Questions</h2>
                  <p className="text-xs text-gray-500">Open questions sorted by helpful votes, prioritizing urgent issues for immediate answering.</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl">
                  {newQuestions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-12 text-center text-gray-500 font-sans">
                      No open questions found.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {newQuestions.map((q) => (
                        <div 
                          key={q._id}
                          onClick={() => onQuestionClick(q)}
                          className="rounded-xl border border-white/5 bg-surface p-4 hover:border-white/10 hover:bg-surface-lighter cursor-pointer transition-all duration-200 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-white hover:text-primary-300 truncate mb-1">{q.title}</h4>
                            <p className="text-[10px] text-gray-500 font-sans">Category: {q.category?.name} • Asked by: {q.author?.name || q.author?.username} • {new Date(q.createdAt).toLocaleDateString()}</p>
                          </div>
                          
                          <div className="flex items-center gap-3 shrink-0">
                            <button
                              onClick={(e) => handleHelpfulVote(e, q._id)}
                              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-200 border ${
                                q.helpfulVotes?.includes(currentUser?._id)
                                  ? "bg-primary-500/20 text-primary-400 border-primary-500/30"
                                  : "bg-surface text-gray-400 border-white/5 hover:border-white/20 hover:text-white"
                              }`}
                            >
                              <ThumbsUp size={12} className={q.helpfulVotes?.includes(currentUser?._id) ? "fill-current" : ""} />
                              Helpful ({q.helpfulVotesCount || 0})
                            </button>
                            <ChevronRight size={16} className="text-gray-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* COHORT PULSE SUB-VIEW */}
            {activeTab === "cohort-pulse" && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 border-b border-white/5 pb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-white mb-2 flex items-center gap-2">
                      <Zap className="text-primary-400 animate-pulse" size={24} />
                      Internship Cohort Pulse
                    </h2>
                    <p className="text-xs text-gray-400">
                      Personalized lifecycle dashboard tracking trending FAQs, common searches, and rising community queries.
                    </p>
                  </div>

                  {cohortData?.phaseInfo && (
                    <div className="shrink-0 font-sans text-right bg-surface-light border border-white/5 rounded-xl px-4 py-2">
                      <p className="text-[10px] text-gray-500 uppercase font-semibold">Current Phase</p>
                      <p className="text-sm font-bold text-primary-400">{cohortData.phaseInfo.name}</p>
                      <p className="text-xs font-semibold text-gray-400 mt-0.5">Day {cohortData.phaseInfo.currentDay ?? 0}</p>
                    </div>
                  )}
                </div>

                {/* Contextual feed grid */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  
                  {/* Column 1: Trending FAQs */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <BookOpen size={16} className="text-violet-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Trending FAQs ({cohortData?.trendingFAQs?.length ?? 0})</h3>
                    </div>
                    
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {cohortData?.trendingFAQs?.length === 0 ? (
                        <p className="text-xs text-gray-500 italic py-4">No trending FAQs mapped to this phase yet.</p>
                      ) : (
                        cohortData?.trendingFAQs?.map(q => (
                          <div 
                            key={q._id}
                            onClick={() => onQuestionClick(q)}
                            className="bg-surface-light border border-white/5 hover:border-white/10 hover:bg-surface-lighter transition-all duration-200 rounded-xl p-4 cursor-pointer flex flex-col gap-2.5"
                          >
                            <h4 className="text-xs font-bold text-white hover:text-primary-300 line-clamp-2 leading-snug">{q.title}</h4>
                            <div className="flex justify-between items-center text-[10px] text-gray-500">
                              <span className="flex items-center gap-1"><Eye size={10} /> {q.views || 0} views</span>
                              <span className="font-semibold text-primary-400">Official FAQ</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Column 2: Rising Issues */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <Flame size={16} className="text-amber-400 animate-pulse" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Rising Issues ({cohortData?.risingIssues?.length ?? 0})</h3>
                    </div>
                    
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {cohortData?.risingIssues?.length === 0 ? (
                        <p className="text-xs text-gray-500 italic py-4">No active community queries in this phase.</p>
                      ) : (
                        cohortData?.risingIssues?.map(q => (
                          <div 
                            key={q._id}
                            onClick={() => onQuestionClick(q)}
                            className="bg-surface-light border border-white/5 hover:border-white/10 hover:bg-surface-lighter transition-all duration-200 rounded-xl p-4 cursor-pointer flex flex-col gap-2.5"
                          >
                            <h4 className="text-xs font-bold text-white hover:text-primary-300 line-clamp-2 leading-snug">{q.title}</h4>
                            <div className="flex justify-between items-center text-[10px] text-gray-500">
                              <span className="flex items-center gap-1"><Eye size={10} /> {q.views || 0} views</span>
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleHelpfulVoteLocal(e, q._id);
                                }}
                                className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[9px] font-bold ${
                                  q.helpfulVotes?.includes(currentUser?._id)
                                    ? "bg-primary-500/20 text-primary-400 border-primary-500/30"
                                    : "bg-surface border-white/5 text-gray-400 hover:text-white"
                                }`}
                              >
                                <ThumbsUp size={8} />
                                {q.helpfulVotesCount || 0}
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                  {/* Column 3: Resolved Notices */}
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                      <CheckCircle size={16} className="text-emerald-400" />
                      <h3 className="text-sm font-bold text-white uppercase tracking-wider">Resolved Notices ({cohortData?.resolvedNotices?.length ?? 0})</h3>
                    </div>
                    
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                      {cohortData?.resolvedNotices?.length === 0 ? (
                        <p className="text-xs text-gray-500 italic py-4">No recently resolved issues in this phase.</p>
                      ) : (
                        cohortData?.resolvedNotices?.map(q => (
                          <div 
                            key={q._id}
                            onClick={() => onQuestionClick(q)}
                            className="bg-surface-light border border-white/5 hover:border-white/10 hover:bg-surface-lighter transition-all duration-200 rounded-xl p-4 cursor-pointer flex flex-col gap-2.5"
                          >
                            <h4 className="text-xs font-bold text-white hover:text-primary-300 line-clamp-2 leading-snug">{q.title}</h4>
                            <div className="flex justify-between items-center text-[10px] text-gray-500">
                              <span className="text-emerald-400 font-semibold flex items-center gap-1"><CheckCircle size={10} /> Resolved</span>
                              <span>{new Date(q.updatedAt).toLocaleDateString()}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* SAVED FAQS SUB-VIEW */}
            {activeTab === "saved-faqs" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">My Saved FAQs</h2>
                  <p className="text-xs text-gray-500">Access your bookmarked questions and guidelines offline instantly.</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl">
                  {savedQuestions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-12 text-center text-xs text-gray-500 font-sans leading-relaxed">
                      No bookmarks saved yet. Click the bookmark option on any question to keep it here.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {savedQuestions.map((q) => (
                        <div 
                          key={q._id}
                          className="rounded-xl border border-white/5 bg-surface p-4 hover:border-white/10 transition-all duration-200 flex items-center justify-between gap-4"
                        >
                          <div 
                            onClick={() => onQuestionClick(q)}
                            className="min-w-0 flex-1 cursor-pointer"
                          >
                            <h4 className="text-sm font-bold text-white hover:text-primary-300 truncate mb-1">{q.title}</h4>
                            <p className="text-[10px] text-gray-500 font-sans">Category: {q.category?.name || "General"} • Saved FAQ</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <button 
                              onClick={() => toggleSaveFAQ(q)}
                              className="rounded border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 p-2 text-red-400 hover:text-white transition-colors"
                              title="Unsave Bookmark"
                            >
                              <Trash size={14} />
                            </button>
                            <button 
                              onClick={() => onQuestionClick(q)}
                              className="flex items-center gap-1.5 rounded border border-white/10 bg-surface-light py-1.5 px-3 text-[10px] font-semibold text-gray-300 hover:text-white transition-colors"
                            >
                              <Eye size={12} />
                              Open
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* DRAFTS SUB-VIEW */}
            {activeTab === "drafts" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">My Drafts</h2>
                  <p className="text-xs text-gray-500">Continue writing your unfinished internship questions.</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl">
                  {drafts.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-12 text-center text-xs text-gray-500 font-sans leading-relaxed">
                      No unfinished drafts found.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {drafts.map((d) => (
                        <div 
                          key={d._id}
                          className="rounded-xl border border-white/5 bg-surface p-4 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-white truncate mb-1">{d.title || "[No Title]"}</h4>
                            <p className="text-[10px] text-gray-500 font-sans">Created: {new Date(d.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <button 
                              onClick={() => deleteDraft(d._id)}
                              className="rounded border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 p-2 text-red-400 hover:text-white transition-colors"
                              title="Delete Draft"
                            >
                              <Trash size={14} />
                            </button>
                            <button 
                              onClick={() => onAskClick(d)}
                              className="flex items-center gap-1.5 rounded bg-primary-500 hover:bg-primary-600 py-1.5 px-3.5 text-[10px] font-bold text-white transition-colors"
                            >
                              Continue Writing
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* NOTIFICATIONS SUB-VIEW */}
            {activeTab === "notifications" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center flex-wrap gap-4">
                  <div>
                    <h2 className="text-xl font-bold text-white mb-2">My Notifications</h2>
                    <p className="text-xs text-gray-500">Stay up to date with comments, answers, and moderation results on your posts.</p>
                  </div>
                  {unreadNotificationsCount > 0 && (
                    <button 
                      onClick={handleAllNotificationsRead}
                      className="text-xs font-semibold px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 hover:bg-indigo-500/20 transition-all duration-200"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>

                <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl font-sans">
                  {notifications.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-12 text-center text-xs text-gray-500 font-sans leading-relaxed">
                      No notifications yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {notifications.map((n) => (
                        <div 
                          key={n._id}
                          className={`rounded-xl border p-4 flex items-center justify-between gap-4 transition-all duration-200 ${
                            n.isRead 
                              ? "border-white/5 bg-surface/50 opacity-70" 
                              : "border-indigo-500/20 bg-indigo-500/5"
                          }`}
                        >
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-white leading-snug">
                              {n.message}
                            </p>
                            <span className="text-[9px] text-gray-500 mt-1 block">
                              Received: {new Date(n.createdAt).toLocaleDateString()} at {new Date(n.createdAt).toLocaleTimeString()}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            {!n.isRead && (
                              <button 
                                onClick={() => handleNotificationRead(n._id)}
                                className="rounded bg-indigo-500 hover:bg-indigo-600 px-2.5 py-1 text-[10px] font-bold text-white transition-colors"
                              >
                                Mark Read
                              </button>
                            )}
                            <button 
                              onClick={() => handleNotificationDelete(n._id)}
                              className="rounded border border-red-500/20 bg-red-500/10 hover:bg-red-500/20 p-2 text-red-400 hover:text-white transition-colors"
                              title="Delete Notification"
                            >
                              <Trash size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-VIEW: PENDING REVIEWS */}
            {activeTab === "pending" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Pending Reviews Queue</h2>
                  <p className="text-xs text-gray-500">Moderate open policy violation reports and pending answers.</p>
                </div>

                {/* Flagged Content Reports */}
                <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                    <AlertTriangle size={16} className="text-amber-500" />
                    Flagged Content Reports ({flaggedQueue.length})
                  </h3>

                  {flaggedQueue.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-8 text-center text-xs text-gray-500">
                      No content items flagged by moderation layers.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {flaggedQueue.map((report) => (
                        <div key={report._id} className="rounded-xl border border-white/5 bg-surface p-4 flex flex-col gap-3">
                          <div className="flex justify-between items-center text-[10px] text-gray-500 border-b border-white/5 pb-2">
                            <span className="uppercase font-bold text-primary-400">{report.targetType}</span>
                            <span>Reason: {report.type}</span>
                            <span className="font-bold text-red-400">Severity: {report.aiSeverity}</span>
                          </div>
                          <div className="flex items-center justify-between text-[10px] text-gray-400 px-1">
                            <span>Flagged By:</span>
                            {report.reportedBy ? (
                              <span className="font-semibold text-gray-300">
                                User ({report.reportedBy.name || report.reportedBy.username})
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 px-2 py-0.5 font-bold uppercase tracking-wider text-[9px]">
                                AI Auto-Moderation
                              </span>
                            )}
                          </div>
                          {report.description && (
                            <div className="text-[10px] text-gray-400 italic px-1 bg-surface-light/40 py-1.5 rounded border border-white/5">
                              <span className="font-semibold not-italic text-gray-500 mr-1">Details:</span> {report.description}
                            </div>
                          )}
                          <div className="bg-surface-light p-3 rounded text-xs text-gray-300">
                            <p className="line-clamp-2">"{report.targetId?.body || report.targetId?.title || "[Content Unavailable]"}"</p>
                          </div>
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => handleModerationAction(report.targetId?._id || report.targetId, "reject")}
                              className="rounded bg-red-500 hover:bg-red-600 px-3 py-1.5 text-[10px] font-semibold text-white transition-colors"
                              title="Report is valid — hide this content"
                            >
                              Approve Report
                            </button>
                            <button
                              onClick={() => handleModerationAction(report.targetId?._id || report.targetId, "approve")}
                              className="rounded bg-emerald-500 hover:bg-emerald-600 px-3 py-1.5 text-[10px] font-semibold text-white transition-colors"
                              title="Report is invalid — content is safe, keep it visible"
                            >
                              Reject Report
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Answer Submissions pending reviews */}
                <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                    <Clock size={16} className="text-indigo-400" />
                    Questions with Pending Answers ({answeredQueue.length})
                  </h3>

                  {answeredQueue.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-8 text-center text-xs text-gray-500">
                      No answer contributions require manual approval.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {answeredQueue.map((q) => (
                        <div 
                          key={q._id}
                          className="rounded-xl border border-white/5 bg-surface p-5 hover:border-white/10 transition-all duration-200 flex flex-col gap-4"
                        >
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <span className="inline-flex rounded bg-primary-500/10 text-primary-300 border border-primary-500/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-2">
                                {q.category?.name || "General"}
                              </span>
                              <h4 
                                onClick={() => onQuestionClick(q)}
                                className="text-sm font-bold text-white hover:text-primary-300 cursor-pointer transition-colors"
                              >
                                {q.title}
                              </h4>
                              <p className="text-[10px] text-gray-500 mt-1">
                                Asked by {q.author?.name || q.author?.username} • {new Date(q.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <button 
                              onClick={() => onQuestionClick(q)}
                              className="flex items-center gap-1.5 rounded border border-white/10 bg-surface-light py-1.5 px-3.5 text-[10px] font-bold text-gray-300 hover:text-white transition-colors shrink-0"
                            >
                              <Eye size={12} />
                              Review Thread
                            </button>
                          </div>

                          {/* List pending answers for this question */}
                          {q.pendingAnswers && q.pendingAnswers.length > 0 && (
                            <div className="border-t border-white/5 pt-3.5 mt-2 space-y-3">
                              <span className="block text-[9px] uppercase font-bold text-indigo-400 tracking-wider mb-1">
                                User Answers to Moderate ({q.pendingAnswers.length}):
                              </span>
                              {q.pendingAnswers.map((ans) => (
                                <div 
                                  key={ans._id} 
                                  className="rounded-lg border border-amber-500/10 bg-surface-light p-3.5 flex flex-col gap-3 border-l-2 border-l-amber-500/40"
                                >
                                  <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[9px] font-bold uppercase">
                                        {ans.author?.name?.substring(0, 2) || ans.author?.username?.substring(0, 2) || "AN"}
                                      </div>
                                      <div>
                                        <p className="text-[10px] font-semibold text-white font-sans">
                                          {ans.author?.name || ans.author?.username || "Anonymous"}
                                        </p>
                                        <p className="text-[8px] text-gray-500 font-mono">
                                          {ans.author?.role === 'admin' ? 'Coordinator' : 'Student'} • Reputation: {ans.author?.reputationScore ?? 0}
                                        </p>
                                      </div>
                                    </div>
                                    <span className="text-[8px] text-gray-500">
                                      Posted: {new Date(ans.createdAt).toLocaleDateString()}
                                    </span>
                                  </div>
                                  <div className="text-xs text-gray-300 whitespace-pre-wrap pl-1 font-sans leading-relaxed">
                                    {ans.body}
                                  </div>
                                  <div className="flex gap-2 justify-end pt-1 border-t border-white/5">
                                    <button
                                      onClick={() => handleModerationAction(ans._id, "approve")}
                                      className="flex items-center gap-1 rounded bg-emerald-500/20 border border-emerald-500/30 py-1 px-3 text-[10px] font-bold text-emerald-400 hover:bg-emerald-500/35 transition-colors"
                                    >
                                      <Check size={10} />
                                      Approve
                                    </button>
                                    <button
                                      onClick={() => handleModerationAction(ans._id, "reject")}
                                      className="flex items-center gap-1 rounded bg-red-500/20 border border-red-500/30 py-1 px-3 text-[10px] font-bold text-red-400 hover:bg-red-500/35 transition-colors"
                                    >
                                      <X size={10} />
                                      Reject
                                    </button>
                                    <button
                                      onClick={() => handleModerationAction(ans._id, "mark_best", q._id)}
                                      className="flex items-center gap-1 rounded bg-amber-500/20 border border-amber-500/30 py-1 px-3 text-[10px] font-bold text-amber-400 hover:bg-amber-500/35 transition-colors"
                                      title="Approve and mark as best answer"
                                    >
                                      <Award size={10} />
                                      Mark Best
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-VIEW: ALL FAQS */}
            {activeTab === "all-faqs" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Official FAQ Repository</h2>
                  <p className="text-xs text-gray-500">Lists all promoted FAQs serving the pre-emptive deflection query engines.</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl">
                  {allFaqs.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-12 text-center text-gray-500">
                      No promoted questions found in the FAQ database.
                    </div>
                  ) : (
                    <div className="space-y-3.5">
                      {allFaqs.map((faq) => (
                        <div 
                          key={faq._id}
                          onClick={() => onQuestionClick(faq)}
                          className="rounded-xl border border-white/5 bg-surface p-4.5 hover:border-white/10 hover:bg-surface-lighter cursor-pointer transition-all duration-200 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-white hover:text-primary-300 truncate mb-1">{faq.title}</h4>
                            <p className="text-[10px] text-gray-500">Category: {faq.category?.name} • Promoted on {new Date(faq.updatedAt).toLocaleDateString()}</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-500 shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}



            {/* SUB-VIEW: MY SUBMISSIONS */}
            {activeTab === "submissions" && (
              <div className="space-y-6 font-sans">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">My Submissions</h2>
                  <p className="text-xs text-gray-500">View questions and answers submitted by your profile.</p>
                </div>

                {/* Sub-tabs selector */}
                <div className="flex border-b border-white/10 gap-6 mb-2">
                  <button
                    onClick={() => setSubmissionsSubTab("questions")}
                    className={`pb-2.5 text-sm font-bold border-b-2 transition-all duration-200 ${
                      submissionsSubTab === "questions"
                        ? "border-primary-500 text-primary-400"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    Questions ({submissions.length})
                  </button>
                  <button
                    onClick={() => setSubmissionsSubTab("answers")}
                    className={`pb-2.5 text-sm font-bold border-b-2 transition-all duration-200 ${
                      submissionsSubTab === "answers"
                        ? "border-primary-500 text-primary-400"
                        : "border-transparent text-gray-400 hover:text-white"
                    }`}
                  >
                    Answers ({userAnswers.length})
                  </button>
                </div>

                <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl">
                  {submissionsSubTab === "questions" ? (
                    submissions.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-12 text-center text-gray-500">
                        You haven't posted any questions yet.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {submissions.map((q) => (
                          <div 
                            key={q._id}
                            onClick={() => onQuestionClick(q)}
                            className="rounded-xl border border-white/5 bg-surface p-4 hover:border-white/10 hover:bg-surface-lighter cursor-pointer transition-all duration-200 flex items-center justify-between gap-4"
                          >
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-white hover:text-primary-300 truncate mb-1">{q.title}</h4>
                              <p className="text-[10px] text-gray-500">Category: {q.category?.name} • Created: {new Date(q.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                              q.status === 'resolved' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {q.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )
                  ) : (
                    userAnswers.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-12 text-center text-gray-500">
                        You haven't contributed any answers yet.
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {userAnswers.map((ans) => {
                          const statusColor = 
                            ans.status === "visible" 
                              ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" 
                              : ans.status === "rejected" 
                              ? "bg-red-500/10 text-red-400 border border-red-500/20" 
                              : "bg-amber-500/10 text-amber-400 border border-amber-500/20";
                          const statusLabel = 
                            ans.status === "visible" 
                              ? "Approved" 
                              : ans.status === "rejected" 
                              ? "Rejected" 
                              : "Pending Moderation";

                          return (
                            <div 
                              key={ans._id} 
                              className="rounded-xl border border-white/5 bg-surface p-4 flex flex-col gap-3"
                            >
                              <div className="flex justify-between items-start flex-wrap gap-2 text-[10px] text-gray-500 border-b border-white/5 pb-2">
                                <span>For Question: <strong 
                                  onClick={() => ans.questionId && onQuestionClick(ans.questionId)} 
                                  className="text-primary-400 hover:underline cursor-pointer"
                                >
                                  {ans.questionId?.title || "View Question"}
                                </strong></span>
                                <span>Posted: {new Date(ans.createdAt).toLocaleDateString()}</span>
                              </div>
                              <div className="text-xs text-gray-300 whitespace-pre-wrap pl-1 font-sans leading-relaxed">
                                {ans.body}
                              </div>
                              <div className="flex justify-between items-center mt-1 pt-2 border-t border-white/5">
                                <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${statusColor}`}>
                                  {statusLabel}
                                </span>
                                {ans.isBestAnswer && (
                                  <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 uppercase tracking-wider">
                                    🏆 Best Answer
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* SUB-VIEW: APPROVED FAQS */}
            {activeTab === "approved" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Promoted & Approved Content</h2>
                  <p className="text-xs text-gray-500">Browse resolved queries and answers marked as verified and approved.</p>
                </div>

                {/* Approved Questions / FAQs */}
                <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                    <CheckCircle size={16} className="text-emerald-500" />
                    Approved FAQs & Questions ({approvedList.length})
                  </h3>

                  {approvedList.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-8 text-center text-xs text-gray-500">
                      No approved queries found in the queue.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {approvedList.map((item) => (
                        <div 
                          key={item._id}
                          onClick={() => onQuestionClick(item)}
                          className="rounded-xl border border-white/5 bg-surface p-4 hover:border-white/10 hover:bg-surface-lighter cursor-pointer transition-all duration-200 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-white hover:text-primary-300 truncate mb-1">{item.title}</h4>
                            <p className="text-[10px] text-gray-500">Category: {item.category?.name} • Promoted: {new Date(item.updatedAt).toLocaleDateString()}</p>
                          </div>
                          <ChevronRight size={16} className="text-gray-500 shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Approved Answers */}
                <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                    <MessageSquare size={16} className="text-emerald-500" />
                    Approved Answers ({approvedAnswersList.length})
                  </h3>

                  {approvedAnswersList.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-8 text-center text-xs text-gray-500">
                      No approved answers found.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {approvedAnswersList.map((item) => (
                        <div 
                          key={item._id}
                          className="rounded-xl border border-white/5 bg-surface p-4 flex flex-col gap-2.5"
                        >
                          <div className="flex justify-between items-start flex-wrap gap-2 text-[10px] text-gray-500 border-b border-white/5 pb-2">
                            <span>Answer by: <strong className="text-gray-300">{item.author?.name || item.author?.username || "Anonymous"}</strong></span>
                            <span>Approved on: {new Date(item.updatedAt).toLocaleDateString()}</span>
                          </div>
                          {item.questionId && (
                            <div className="text-[10px] text-primary-400 font-semibold">
                              For Question: <span onClick={() => onQuestionClick(item.questionId)} className="hover:underline cursor-pointer">"{item.questionId.title}"</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-300 whitespace-pre-wrap bg-surface-light/40 p-3 rounded border border-white/5 leading-relaxed">
                            {item.body}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-VIEW: REJECTED FAQS */}
            {activeTab === "rejected" && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Rejected & Deleted Content</h2>
                  <p className="text-xs text-gray-500">Queries and answers soft-deleted or hidden during moderation workflows.</p>
                </div>

                {/* Rejected Questions / FAQs */}
                <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                    <XCircle size={16} className="text-red-500" />
                    Rejected FAQs & Questions ({rejectedList.length})
                  </h3>

                  {rejectedList.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-8 text-center text-xs text-gray-500">
                      No rejected queries found.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {rejectedList.map((item) => (
                        <div 
                          key={item._id}
                          className="rounded-xl border border-white/5 bg-surface p-4 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-gray-400 truncate mb-1">{item.title}</h4>
                            <p className="text-[10px] text-gray-500">Category: {item.category?.name} • Deleted: {new Date(item.updatedAt).toLocaleDateString()}</p>
                          </div>
                          <span className="inline-flex rounded-full bg-red-500/10 text-red-400 border border-red-500/20 px-2.5 py-0.5 text-[9px] font-bold uppercase shrink-0">
                            Rejected
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Rejected Answers */}
                <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl">
                  <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4 flex items-center gap-2">
                    <MessageSquare size={16} className="text-red-500" />
                    Rejected Answers ({rejectedAnswersList.length})
                  </h3>

                  {rejectedAnswersList.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-8 text-center text-xs text-gray-500">
                      No rejected answers found.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {rejectedAnswersList.map((item) => (
                        <div 
                          key={item._id}
                          className="rounded-xl border border-white/5 bg-surface p-4 flex flex-col gap-2.5"
                        >
                          <div className="flex justify-between items-start flex-wrap gap-2 text-[10px] text-gray-500 border-b border-white/5 pb-2">
                            <span>Answer by: <strong className="text-gray-300">{item.author?.name || item.author?.username || "Anonymous"}</strong></span>
                            <span>Rejected on: {new Date(item.updatedAt).toLocaleDateString()}</span>
                          </div>
                          {item.questionId && (
                            <div className="text-[10px] text-primary-400 font-semibold">
                              For Question: <span onClick={() => onQuestionClick(item.questionId)} className="hover:underline cursor-pointer">"{item.questionId.title}"</span>
                            </div>
                          )}
                          <div className="text-xs text-gray-400 whitespace-pre-wrap bg-surface-light/40 p-3 rounded border border-white/5 leading-relaxed">
                            {item.body}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* SUB-VIEW: SETTINGS */}
            {activeTab === "settings" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Profile & Settings</h2>
                  <p className="text-xs text-gray-500">Update personal profile and review moderator credentials.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Left Column Settings Form */}
                  <form onSubmit={handleSettingsSave} className="lg:col-span-2 rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Edit Settings</h3>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Full Name</label>
                      <input
                        type="text"
                        value={updateName}
                        onChange={(e) => setUpdateName(e.target.value)}
                        required
                        className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white focus:border-primary-500 focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Email</label>
                        <input
                          type="email"
                          value={profile?.email || ""}
                          disabled
                          className="w-full rounded-lg border border-white/10 bg-surface/50 py-2.5 px-4 text-sm text-gray-400 cursor-not-allowed focus:outline-none select-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Username</label>
                        <input
                          type="text"
                          value={updateUsername}
                          onChange={(e) => setUpdateUsername(e.target.value)}
                          required
                          className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white focus:border-primary-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Authorisation Level</label>
                      <input
                        type="text"
                        value={
                          profile?.role === "user" || profile?.role === "student"
                            ? "Student"
                            : profile?.profileMetadata?.authTier || (profile?.role === "superadmin" ? "Super Admin" : "Moderator")
                        }
                        disabled
                        className="w-full rounded-lg border border-white/10 bg-surface/50 py-2.5 px-4 text-sm text-gray-400 cursor-not-allowed focus:outline-none select-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={savingSettings}
                      className="rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-50 py-2.5 px-6 text-sm font-semibold text-white flex items-center gap-2 transition-colors pt-2"
                    >
                      {savingSettings ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                      Save Profile
                    </button>
                  </form>

                  {/* Right Column Metadata Panel */}
                  <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl space-y-4">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400">Current Profile Card</h3>
                    <div className="flex flex-col items-center text-center p-4">
                      <div className="flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 text-xl font-bold mb-3 uppercase">
                        {profile.name?.substring(0, 2) || profile.username?.substring(0, 2) || "AD"}
                      </div>
                      <h4 className="text-base font-bold text-white">{profile.name || profile.username}</h4>
                      <p className="text-xs text-gray-400">@{profile.username}</p>
                    </div>
                    <div className="border-t border-white/5 pt-4 space-y-3 text-xs text-gray-300">
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-gray-500">Email</span>
                        <strong className="text-white font-medium">{profile.email}</strong>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-gray-500">Authorisation Level</span>
                        <strong className="text-indigo-400 font-bold">
                          {profile?.role === "user" || profile?.role === "student"
                            ? "Student"
                            : profile?.profileMetadata?.authTier || (profile?.role === "superadmin" ? "Super Admin" : "Moderator")}
                        </strong>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* SUB-VIEW: TROUBLESHOOTING SYSTEM */}
            {activeTab === "support" && (
              <div className="space-y-6">
                {selectedTicketId && selectedTicketData ? (
                  <div className="space-y-6">
                    {/* Header with back button */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => { setSelectedTicketId(null); setSelectedTicketData(null); }}
                          className="flex items-center justify-center h-8 w-8 rounded-lg border border-white/10 bg-surface hover:bg-surface-light text-gray-400 hover:text-white transition-colors"
                        >
                          <ArrowLeft size={16} />
                        </button>
                        <div>
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className="inline-flex rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
                              {categoryMap[selectedTicketData.ticket.category] || "Other"}
                            </span>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              selectedTicketData.ticket.status === 'resolved' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : selectedTicketData.ticket.status === 'in_progress'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {statusMap[selectedTicketData.ticket.status] || selectedTicketData.ticket.status}
                            </span>
                          </div>
                          <h2 className="text-xl font-bold text-white">{selectedTicketData.ticket.title}</h2>
                          <p className="text-xs text-gray-500">
                            Opened by <strong className="text-gray-400">{selectedTicketData.ticket.createdBy?.name || selectedTicketData.ticket.createdBy?.username || "Unknown"}</strong> on {new Date(selectedTicketData.ticket.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Admin actions block */}
                    {!isStudent && (
                      <div className="rounded-xl border border-blue-500/10 bg-blue-950/20 p-4 flex flex-wrap items-center justify-between gap-4">
                        <div className="text-xs">
                          <p className="text-gray-400">
                            Current Assignee: <strong className="text-white">{selectedTicketData.ticket.assignedTo?.name || selectedTicketData.ticket.assignedTo?.username || "Unassigned"}</strong>
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-semibold uppercase">Assign to:</span>
                            <select
                              value={selectedTicketData.ticket.assignedTo?._id || ""}
                              onChange={(e) => {
                                if (e.target.value) {
                                  handleAssignTicket(e.target.value);
                                }
                              }}
                              className="rounded-lg border border-white/10 bg-surface py-1.5 px-3 text-xs text-white focus:outline-none focus:border-primary-500"
                            >
                              <option value="" disabled>Select Staff...</option>
                              {staffList.map((staff) => (
                                <option key={staff._id} value={staff._id}>
                                  {staff.name || staff.username} ({staff.role === 'admin' ? 'Admin' : 'Moderator'})
                                </option>
                              ))}
                            </select>
                          </div>
                          
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 font-semibold uppercase">Status:</span>
                            {isAssignee || isUnassigned ? (
                              <select
                                value={selectedTicketData.ticket.status}
                                onChange={(e) => handleUpdateStatus(e.target.value)}
                                disabled={updatingTicketStatus}
                                className="rounded-lg border border-white/10 bg-surface py-1.5 px-3 text-xs text-white focus:outline-none focus:border-primary-500"
                              >
                                <option value="open">Open</option>
                                <option value="in_progress">In Progress</option>
                                <option value="resolved">Resolved</option>
                              </select>
                            ) : (
                              <span className="text-xs text-gray-300 font-bold uppercase py-1 px-3 bg-white/5 border border-white/10 rounded-lg">
                                {statusMap[selectedTicketData.ticket.status] || selectedTicketData.ticket.status}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* Thread Messages */}
                      <div className="lg:col-span-2 space-y-4">
                        {/* Ticket original description (acts as first message) */}
                        <div className="rounded-xl border border-white/10 bg-surface-light p-5 space-y-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 rounded-full bg-primary-500/15 text-primary-400 border border-primary-500/20 flex items-center justify-center text-xs font-bold uppercase">
                                {selectedTicketData.ticket.createdBy?.name?.substring(0, 2) || selectedTicketData.ticket.createdBy?.username?.substring(0, 2) || "U"}
                              </div>
                              <div>
                                <strong className="text-xs text-white block">{selectedTicketData.ticket.createdBy?.name || selectedTicketData.ticket.createdBy?.username}</strong>
                                <span className="text-[10px] text-gray-500 uppercase tracking-wide">{selectedTicketData.ticket.createdBy?.role}</span>
                              </div>
                            </div>
                            <span className="text-[10px] text-gray-500">{new Date(selectedTicketData.ticket.createdAt).toLocaleTimeString()}</span>
                          </div>
                          <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed">
                            {selectedTicketData.ticket.description}
                          </p>

                          {/* Attachments inside original post if any */}
                          {selectedTicketData.ticket.attachments && selectedTicketData.ticket.attachments.length > 0 && (
                            <div className="border-t border-white/5 pt-3 mt-3">
                              <span className="block text-[10px] font-bold text-gray-500 uppercase mb-2">Attachments</span>
                              <div className="flex flex-wrap gap-2">
                                {selectedTicketData.ticket.attachments.map((att) => (
                                  <a
                                    key={att._id}
                                    href={att.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group relative block rounded-lg border border-white/10 bg-surface/50 overflow-hidden hover:border-blue-500/30 transition-colors w-24 h-24"
                                  >
                                    <img
                                      src={att.url}
                                      alt="attachment"
                                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                    />
                                  </a>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Message replies */}
                        <div className="space-y-3">
                          {selectedTicketData.messages && selectedTicketData.messages.map((msg) => {
                            const isMsgStaff = ['moderator', 'admin'].includes(msg.author?.role);
                            return (
                              <div
                                key={msg._id}
                                className={`rounded-xl border p-4 space-y-2 ${
                                  isMsgStaff
                                    ? "border-blue-500/10 bg-blue-950/10"
                                    : "border-white/5 bg-surface"
                                }`}
                              >
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2">
                                    <div className={`h-6 w-6 rounded-full flex items-center justify-center text-[10px] font-bold uppercase ${
                                      isMsgStaff 
                                        ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20' 
                                        : 'bg-primary-500/15 text-primary-400 border border-primary-500/20'
                                    }`}>
                                      {msg.author?.name?.substring(0, 2) || msg.author?.username?.substring(0, 2) || "U"}
                                    </div>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <strong className="text-xs text-white">{msg.author?.name || msg.author?.username}</strong>
                                        {isMsgStaff && (
                                          <span className="rounded bg-blue-500/10 text-blue-400 border border-blue-500/20 px-1 py-0.5 text-[8px] font-bold uppercase tracking-wider">
                                            Staff
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </div>
                                  <span className="text-[10px] text-gray-500">{new Date(msg.createdAt).toLocaleString()}</span>
                                </div>
                                <p className="text-sm text-gray-300 whitespace-pre-wrap leading-relaxed pl-8">
                                  {msg.body}
                                </p>
                              </div>
                            );
                          })}
                        </div>

                        {/* Reply form */}
                        {isStudent || isAssignee || isUnassigned ? (
                          <form onSubmit={handleReplySubmit} className="rounded-xl border border-white/10 bg-surface p-4 space-y-3">
                            <textarea
                              value={newReplyText}
                              onChange={(e) => setNewReplyText(e.target.value)}
                              required
                              rows={3}
                              placeholder="Type a message to reply..."
                              className="w-full rounded-lg border border-white/10 bg-surface-light py-2 px-3 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none resize-none"
                            />
                            <div className="flex justify-end">
                              <button
                                type="submit"
                                disabled={submittingReply}
                                className="rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-50 px-4 py-2 text-xs font-semibold text-white flex items-center gap-1.5 transition-colors"
                              >
                                {submittingReply ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                                Send Reply
                              </button>
                            </div>
                          </form>
                        ) : (
                          <div className="rounded-xl border border-amber-500/10 bg-amber-500/5 p-4 text-center text-xs text-amber-400">
                            This ticket is assigned to another moderator/admin. Only the assignee can reply or solve this ticket.
                          </div>
                        )}
                      </div>

                      {/* Ticket Details Info Sidebar */}
                      <div className="lg:col-span-1 space-y-6">
                        <div className="rounded-xl border border-white/10 bg-surface-light p-5 space-y-4">
                          <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider">Ticket Info</h3>
                          
                          <div className="space-y-3 text-xs border-t border-white/5 pt-3">
                            <div>
                              <span className="text-gray-500 block">Category</span>
                              <strong className="text-white text-sm font-medium">{categoryMap[selectedTicketData.ticket.category] || "Other"}</strong>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Status</span>
                              <strong className="text-white text-sm font-medium uppercase">{selectedTicketData.ticket.status}</strong>
                            </div>
                            <div>
                              <span className="text-gray-500 block">Opened On</span>
                              <strong className="text-white text-sm font-medium">{new Date(selectedTicketData.ticket.createdAt).toLocaleString()}</strong>
                            </div>
                            {selectedTicketData.ticket.assignedTo ? (
                              <div>
                                <span className="text-gray-500 block">Assigned Staff</span>
                                <strong className="text-white text-sm font-medium">{selectedTicketData.ticket.assignedTo.name || selectedTicketData.ticket.assignedTo.username}</strong>
                              </div>
                            ) : (
                              <div>
                                <span className="text-gray-500 block">Assigned Staff</span>
                                <strong className="text-gray-400 text-sm font-medium">Unassigned</strong>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div>
                      <h2 className="text-xl font-bold text-white mb-2">Troubleshooting</h2>
                      <p className="text-xs text-gray-500">
                        {isStudent 
                          ? "Submit login, technical, or other sensitive private tickets here. Support discussions are strictly confidential."
                          : "Manage private user tickets, assign moderators, and reply to technical or login issues."}
                      </p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      
                      {/* Ticket Form */}
                      {isStudent && (
                        <form onSubmit={handleTicketSubmit} className="lg:col-span-1 rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl space-y-4 h-fit">
                          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Submit Support Ticket</h3>
                          
                          <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Category</label>
                            <select
                              value={ticketCategory}
                              onChange={(e) => setTicketCategory(e.target.value)}
                              className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white focus:border-primary-500 focus:outline-none"
                            >
                              <option value="technical">Technical Issue</option>
                              <option value="login">Login Issue</option>
                              <option value="other">Other</option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Title</label>
                            <input
                              type="text"
                              value={ticketTitle}
                              onChange={(e) => setTicketTitle(e.target.value)}
                              required
                              placeholder="e.g. Can't access my dashboard"
                              className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Description (Min 20 chars)</label>
                            <textarea
                              value={ticketDesc}
                              onChange={(e) => setTicketDesc(e.target.value)}
                              required
                              rows={4}
                              placeholder="Describe your issue in detail..."
                              className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none resize-none"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Screenshot Attachment (Optional)</label>
                            <input
                              id="ticket-file-input"
                              type="file"
                              accept="image/*"
                              onChange={(e) => setTicketAttachment(e.target.files[0])}
                              className="w-full text-xs text-gray-400 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-surface file:text-gray-300 hover:file:bg-white/5 cursor-pointer file:cursor-pointer"
                            />
                          </div>

                          <button
                            type="submit"
                            disabled={submittingTicket}
                            className="w-full rounded-lg bg-primary-500 hover:bg-primary-600 disabled:opacity-50 py-2.5 text-xs font-semibold text-white flex items-center justify-center gap-1.5 transition-colors pt-2"
                          >
                            {submittingTicket ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
                            Submit Ticket
                          </button>
                        </form>
                      )}

                      {/* Tickets List */}
                      <div className={`${isStudent ? 'lg:col-span-2' : 'lg:col-span-3'} rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl`}>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">
                          {isStudent ? "My Support Tickets" : "Support Tickets Queue"}
                        </h3>

                        {tickets.length === 0 ? (
                          <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-12 text-center text-gray-500">
                            No support tickets found.
                          </div>
                        ) : (
                          <div className="space-y-3">
                            {tickets.map((t) => (
                              <div
                                key={t._id}
                                onClick={() => handleTicketClick(t._id)}
                                className="rounded-xl border border-white/5 bg-surface p-4 flex items-center justify-between gap-4 hover:border-white/10 hover:bg-surface-light transition-all duration-200 cursor-pointer"
                              >
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center gap-2 mb-1">
                                    <span className="inline-flex rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider">
                                      {categoryMap[t.category] || "Other"}
                                    </span>
                                    <h4 className="text-sm font-bold text-white truncate">{t.title}</h4>
                                  </div>
                                  <p className="text-[10px] text-gray-500">
                                    {!isStudent && `Opened by: ${t.createdBy?.name || t.createdBy?.username || "Unknown"} • `}
                                    Opened: {new Date(t.createdAt).toLocaleDateString()}
                                    {t.assignedTo && ` • Assigned to: ${t.assignedTo.name || t.assignedTo.username}`}
                                  </p>
                                </div>
                                <div className="flex items-center gap-3">
                                  <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                                    t.status === 'resolved' 
                                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                      : t.status === 'in_progress'
                                      ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {statusMap[t.status] || t.status}
                                  </span>
                                  <ChevronRight size={14} className="text-gray-600" />
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {/* Report Modal */}
      {isReportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl border border-white/10 bg-surface-light p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
              <div className="flex items-center gap-2 text-red-400">
                <ShieldAlert size={18} />
                <h3 className="text-base font-bold text-white">Report Question</h3>
              </div>
              <button 
                onClick={() => setIsReportModalOpen(false)}
                className="text-gray-400 hover:text-white"
              >
                <X size={16} />
              </button>
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
                  className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-3 text-sm text-white focus:border-primary-400/50 focus:outline-none"
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
                  placeholder="Provide additional details or context about why you are reporting this question..."
                  className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white placeholder-gray-600 focus:border-primary-400/50 focus:outline-none resize-none"
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

      {/* Toast Notification */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border p-4 shadow-2xl backdrop-blur-md transition-all duration-300 animate-in fade-in slide-in-from-bottom-5 ${
          toast.type === "success"
            ? "bg-emerald-950/80 border-emerald-500/30 text-emerald-300 shadow-emerald-950/50"
            : "bg-red-950/80 border-red-500/30 text-red-300 shadow-red-950/50"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-red-400 shrink-0" />
          )}
          <span className="text-sm font-semibold">{toast.message}</span>
          <button 
            onClick={() => setToast(null)} 
            className="ml-2 text-white/40 hover:text-white transition-colors"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
};

export default MyProfile;
