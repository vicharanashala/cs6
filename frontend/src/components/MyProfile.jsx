import { useState, useEffect } from "react";
import { 
  Home as HomeIcon, MessageSquare, Folder, PlusCircle, FileText, 
  Clock, CheckCircle, XCircle, Settings, Headphones, ChevronDown, 
  Award, Shield, Mail, Calendar, ChevronRight, Eye, Check, X, 
  AlertTriangle, Save, Loader2, Send, ArrowLeft, GraduationCap,
  Flame, Sun, Bookmark, Edit3, Bell, User as UserIcon, Trash
} from "lucide-react";
import api from "../api/axios";

const MyProfile = ({ currentUser, onBack, onQuestionClick, onAskClick }) => {
  const [profile, setProfile] = useState(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [activeTab, setActiveTab] = useState(currentUser?.role === "admin" ? "pending" : "home");
  
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

  const [loadingData, setLoadingData] = useState(false);
  const [actionMessage, setActionMessage] = useState("");

  // Form states
  const [updateName, setUpdateName] = useState("");
  const [updateMetadata, setUpdateMetadata] = useState({
    department: "",
    staffId: "",
    authTier: "Level 1"
  });
  const [savingSettings, setSavingSettings] = useState(false);

  // Ticket form states
  const [ticketTitle, setTicketTitle] = useState("");
  const [ticketDesc, setTicketDesc] = useState("");
  const [submittingTicket, setSubmittingTicket] = useState(false);

  const isStudent = currentUser?.role === "user";
  const isAdmin = currentUser?.role === "admin";

  useEffect(() => {
    if (currentUser?._id) {
      fetchUserProfile();
      fetchNotifications();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser?._id) {
      loadTabContent();
    }
  }, [currentUser, activeTab]);

  const fetchUserProfile = async () => {
    try {
      const response = await api.get(`/users/${currentUser._id}/profile`);
      if (response.data.success) {
        const uProfile = response.data.data;
        setProfile(uProfile);
        setUpdateName(uProfile.name || uProfile.username);
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
        // Load categories and user submissions
        const catRes = await api.get("/categories");
        const subRes = await api.get(`/users/${currentUser._id}/questions`);
        if (catRes.data.success) setCategories(catRes.data.data || []);
        if (subRes.data.success) setSubmissions(subRes.data.data || []);
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
        if (aResponse.data.success) setUserAnswers(aResponse.data.data || []);
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
      } else if (activeTab === "popular") {
        const response = await api.get("/questions?sort=mostViewed");
        if (response.data.success) setPopularQuestions(response.data.data || []);
      } else if (activeTab === "whats-new") {
        const response = await api.get("/questions?sort=newest");
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
      }
    } catch (error) {
      console.error(`Error loading tab content for ${activeTab}:`, error);
    } finally {
      setLoadingData(false);
    }
  };

  const handleModerationAction = async (targetId, action) => {
    setActionMessage("");
    try {
      const response = await api.patch(`/moderation/${targetId}/${action}`);
      if (response.data.success) {
        const label = action === 'reject' ? 'Report approved — content hidden' : action === 'approve' ? 'Report rejected — content kept visible' : `Successfully executed ${action} action.`;
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
        profileMetadata: {
          ...profile.profileMetadata,
          department: updateMetadata.department,
          staffId: updateMetadata.staffId,
          authTier: updateMetadata.authTier
        }
      });

      if (response.data.success) {
        setProfile(prev => ({
          ...prev,
          name: response.data.data.name,
          profileMetadata: response.data.data.profileMetadata
        }));
        setActionMessage("Settings updated successfully!");
      }
    } catch (error) {
      console.error(error);
      setActionMessage("Error saving settings.");
    } finally {
      setSavingSettings(false);
    }
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
        description: ticketDesc
      });
      if (response.data.success) {
        setTicketTitle("");
        setTicketDesc("");
        setActionMessage("Support ticket opened successfully!");
        loadTabContent(); // reload list
      }
    } catch (error) {
      console.error(error);
      alert("Failed to submit support ticket.");
    } finally {
      setSubmittingTicket(false);
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

  // Student Layout handled by unified sidebar layout below


  // Render Sidebar Layout for Admin / Student
  return (
    <div className="flex bg-surface min-h-[calc(100vh-73px)] text-white">
      
      {/* ---------------------------------------------------- */}
      {/* LEFT SIDEBAR NAVIGATION PANEL                        */}
      {/* ---------------------------------------------------- */}
      <aside className="w-64 shrink-0 border-r border-white/10 bg-surface-dark flex flex-col justify-between p-5 select-none font-sans">
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
                  onClick={() => setActiveTab("all-faqs")}
                  className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "all-faqs"
                      ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <MessageSquare size={16} className={activeTab === "all-faqs" ? "text-blue-400" : "text-gray-400"} />
                  All FAQs
                </button>

                <button
                  onClick={() => setActiveTab("categories")}
                  className={`flex items-center gap-3 w-full rounded-lg px-3.5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                    activeTab === "categories"
                      ? "bg-blue-950/40 text-blue-400 border-l-2 border-primary-500"
                      : "text-gray-300 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <Folder size={16} className={activeTab === "categories" ? "text-blue-400" : "text-gray-400"} />
                  Categories
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
                  <Headphones size={16} className={activeTab === "support" ? "text-blue-400" : "text-gray-400"} />
                  Help & Support
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
                <Headphones size={18} className={activeTab === "support" ? "text-blue-400" : "text-gray-400"} />
                Help & Support
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
            {/* STUDENT WORKSPACE DASHBOARD */}
            {activeTab === "home" && (
              <div className="space-y-8">
                {/* Banner Card */}
                <div className="rounded-2xl border border-white/10 bg-gradient-to-r from-primary-600/20 to-indigo-600/20 p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div>
                    <h3 className="text-xl font-bold text-white mb-2">Student Workspace</h3>
                    <p className="text-sm text-gray-300 leading-relaxed max-w-md font-sans">
                      Welcome back, {profile?.name || profile?.username}! Pitch in with answers, ask questions, and build your contributor reputation.
                    </p>
                  </div>
                  <div className="bg-surface-light border border-white/10 p-5 rounded-xl flex items-center gap-4 shadow-lg min-w-[200px] shrink-0">
                    <div className="h-12 w-12 rounded-lg bg-primary-500/10 flex items-center justify-center text-primary-400 border border-primary-500/20">
                      <Award size={24} />
                    </div>
                    <div>
                      <span className="block text-[10px] uppercase font-bold text-gray-500">Contribution Points</span>
                      <strong className="text-3xl font-extrabold text-white tracking-tight">{contributionPoints}</strong>
                    </div>
                  </div>
                </div>

                {/* Grid Layout: Left Details, Right Recent Questions */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="space-y-6">
                    {/* Contributor Card */}
                    <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl relative overflow-hidden">
                      <div className="relative flex flex-col items-center text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary-500 to-indigo-600 text-white text-xl font-bold uppercase mb-4 border-2 border-white/10">
                          {profile?.name?.substring(0, 2) || profile?.username?.substring(0, 2) || "U"}
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/20 px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-3">
                          <GraduationCap size={10} />
                          Student Contributor
                        </span>
                        <h2 className="text-lg font-bold text-white">{profile?.name || profile?.username}</h2>
                        <p className="text-xs text-gray-400">@{profile?.username}</p>
                        <div className="w-full border-t border-white/5 my-4.5" />
                        <div className="w-full space-y-3 text-left text-xs text-gray-300">
                          <div className="flex items-center gap-3">
                            <Mail size={14} className="text-gray-500" />
                            <span className="truncate">{currentUser?.email}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Calendar size={14} className="text-gray-500" />
                            <span>Joined {profile?.joinedAt ? new Date(profile.joinedAt).toLocaleDateString() : ""}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <Award size={14} className="text-gray-500" />
                            <span>Reputation: <strong className="text-primary-300">{profile?.badgeLevel || "Newbie"}</strong></span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Profile Custom Metadata Card */}
                    <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-4">Profile Details</h3>
                      <div className="space-y-4 text-xs font-sans">
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-gray-500">College / University</span>
                          <span className="text-white font-medium">{profile?.profileMetadata?.college || "Not set"}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-gray-500">Branch / Major</span>
                          <span className="text-white font-medium">{profile?.profileMetadata?.major || "Not set"}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-gray-500">Current Semester</span>
                          <span className="text-white font-medium">{profile?.profileMetadata?.semester || "Not set"}</span>
                        </div>
                        <div>
                          <span className="block text-[9px] uppercase font-bold text-gray-500">Areas of Interest</span>
                          <div className="flex flex-wrap gap-1 mt-2">
                            {profile?.profileMetadata?.interests ? profile.profileMetadata.interests.split(",").map((interest, idx) => (
                              <span key={idx} className="rounded bg-surface px-2 py-0.5 text-[9px] font-medium text-gray-300 border border-white/5">
                                {interest.trim()}
                              </span>
                            )) : <span className="text-gray-500 text-[10px] italic">No interests configured</span>}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Column Workspace Metrics & Submissions */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Metrics Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="rounded-xl border border-white/5 bg-surface-light p-4 text-center">
                        <span className="text-xl font-bold text-white">{stats.questionsAsked}</span>
                        <span className="block text-[9px] text-gray-400 font-semibold uppercase mt-1">Asked</span>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-surface-light p-4 text-center">
                        <span className="text-xl font-bold text-white">{stats.answersGiven}</span>
                        <span className="block text-[9px] text-gray-400 font-semibold uppercase mt-1">Answered</span>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-surface-light p-4 text-center">
                        <span className="text-xl font-bold text-primary-400">{stats.bestAnswers}</span>
                        <span className="block text-[9px] text-gray-400 font-semibold uppercase mt-1">Best Chosen</span>
                      </div>
                      <div className="rounded-xl border border-white/5 bg-surface-light p-4 text-center">
                        <span className="text-xl font-bold text-indigo-400">{stats.upvotesReceived}</span>
                        <span className="block text-[9px] text-gray-400 font-semibold uppercase mt-1">Upvotes</span>
                      </div>
                    </div>

                    {/* Submissions Section */}
                    <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 flex items-center gap-2">
                          <FileText size={16} className="text-primary-400" />
                          Recent Submissions ({submissions.slice(0, 5).length})
                        </h3>
                        <button 
                          onClick={() => setActiveTab("submissions")}
                          className="text-[10px] font-bold text-primary-400 hover:underline uppercase"
                        >
                          View All
                        </button>
                      </div>

                      {submissions.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-8 text-center text-xs text-gray-500">
                          You haven't submitted any questions yet.
                        </div>
                      ) : (
                        <div className="space-y-2.5">
                          {submissions.slice(0, 5).map((q) => (
                            <div 
                              key={q._id}
                              onClick={() => onQuestionClick(q)}
                              className="rounded-xl border border-white/5 bg-surface p-3.5 hover:border-white/10 hover:bg-surface-lighter cursor-pointer transition-all duration-200 flex items-center justify-between gap-4"
                            >
                              <div className="min-w-0 flex-1">
                                <h4 className="text-xs font-bold text-white hover:text-primary-300 truncate mb-1">{q.title}</h4>
                                <p className="text-[9px] text-gray-500">Category: {q.category?.name} • Asked on {new Date(q.createdAt).toLocaleDateString()}</p>
                              </div>
                              <ChevronRight size={14} className="text-gray-500 shrink-0" />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* POPULAR SUB-VIEW */}
            {activeTab === "popular" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Popular FAQs & Questions</h2>
                  <p className="text-xs text-gray-500">Browse highly viewed questions and deflection logs across the campus community.</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl">
                  {popularQuestions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-12 text-center text-gray-500 font-sans">
                      No popular questions loaded.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {popularQuestions.map((q) => (
                        <div 
                          key={q._id}
                          onClick={() => onQuestionClick(q)}
                          className="rounded-xl border border-white/5 bg-surface p-4 hover:border-white/10 hover:bg-surface-lighter cursor-pointer transition-all duration-200 flex items-center justify-between gap-4"
                        >
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-white hover:text-primary-300 truncate mb-1">{q.title}</h4>
                            <p className="text-[10px] text-gray-500 font-sans">Category: {q.category?.name} • Views: {q.views || 0} • {new Date(q.createdAt).toLocaleDateString()}</p>
                          </div>
                          <div className="flex items-center gap-3 shrink-0">
                            <span className="inline-flex items-center gap-1 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 text-[9px] font-bold">
                              🔥 Popular
                            </span>
                            <ChevronRight size={16} className="text-gray-500" />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* WHATS NEW SUB-VIEW */}
            {activeTab === "whats-new" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Recently Posted Questions</h2>
                  <p className="text-xs text-gray-500">See what users are currently asking in real-time.</p>
                </div>

                <div className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl">
                  {newQuestions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-12 text-center text-gray-500 font-sans">
                      No recent questions found.
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
                          <ChevronRight size={16} className="text-gray-500 shrink-0" />
                        </div>
                      ))}
                    </div>
                  )}
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

            {/* SUB-VIEW: CATEGORIES */}
            {activeTab === "categories" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Category Configurations</h2>
                  <p className="text-xs text-gray-500">Browse categories and active question counts.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {categories.map((cat) => (
                    <div key={cat._id} className="rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl flex flex-col justify-between">
                      <div>
                        <h4 className="text-base font-bold text-white mb-2">{cat.name}</h4>
                        <p className="text-xs text-gray-400 leading-relaxed mb-4">{cat.description}</p>
                      </div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 px-2.5 py-1 rounded-full self-start">
                        Questions: {cat.questionCount ?? 0}
                      </span>
                    </div>
                  ))}
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
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Department</label>
                        <input
                          type="text"
                          value={updateMetadata.department}
                          onChange={(e) => setUpdateMetadata({...updateMetadata, department: e.target.value})}
                          required
                          className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white focus:border-primary-500 focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Staff ID</label>
                        <input
                          type="text"
                          value={updateMetadata.staffId}
                          onChange={(e) => setUpdateMetadata({...updateMetadata, staffId: e.target.value})}
                          required
                          className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white focus:border-primary-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Authorization Level</label>
                      <select
                        value={updateMetadata.authTier}
                        onChange={(e) => setUpdateMetadata({...updateMetadata, authTier: e.target.value})}
                        className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white focus:border-primary-500 focus:outline-none"
                      >
                        <option value="Level 1" className="bg-surface-light text-white">Level 1 (Basic Moderator)</option>
                        <option value="Level 2" className="bg-surface-light text-white">Level 2 (Senior Moderator)</option>
                        <option value="Super Admin" className="bg-surface-light text-white">Super Admin (System Owner)</option>
                      </select>
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
                        <span className="block text-[9px] uppercase font-bold text-gray-500">Department</span>
                        <strong className="text-white font-medium">{profile.profileMetadata?.department || "VLED Lab"}</strong>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-gray-500">Staff ID</span>
                        <strong className="text-white font-mono font-medium">{profile.profileMetadata?.staffId || "IITR-ADM-2026"}</strong>
                      </div>
                      <div>
                        <span className="block text-[9px] uppercase font-bold text-gray-500">Tier</span>
                        <strong className="text-indigo-400 font-bold">{profile.profileMetadata?.authTier || "Super Admin"}</strong>
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            )}

            {/* SUB-VIEW: HELP & SUPPORT */}
            {activeTab === "support" && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-white mb-2">Help & support</h2>
                  <p className="text-xs text-gray-500">Create ticket queries for administrative support or review past logs.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  
                  {/* Ticket Form */}
                  <form onSubmit={handleTicketSubmit} className="lg:col-span-1 rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl space-y-4 h-fit">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">Submit Support Ticket</h3>
                    
                    <div>
                      <label className="block text-xs font-semibold text-gray-400 uppercase mb-1.5">Title</label>
                      <input
                        type="text"
                        value={ticketTitle}
                        onChange={(e) => setTicketTitle(e.target.value)}
                        required
                        placeholder="e.g. Server Latency Issue"
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
                        placeholder="Detail the issue with environment parameters..."
                        className="w-full rounded-lg border border-white/10 bg-surface py-2.5 px-4 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none resize-none"
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

                  {/* Tickets List */}
                  <div className="lg:col-span-2 rounded-2xl border border-white/10 bg-surface-light p-6 shadow-xl">
                    <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">My Support Tickets</h3>

                    {tickets.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-white/10 bg-surface/30 p-12 text-center text-gray-500">
                        No support tickets opened.
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {tickets.map((t) => (
                          <div key={t._id} className="rounded-xl border border-white/5 bg-surface p-4 flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <h4 className="text-sm font-bold text-white truncate mb-1">{t.title}</h4>
                              <p className="text-[10px] text-gray-500">Status: <strong className="text-gray-400 uppercase">{t.status}</strong> • Opened {new Date(t.createdAt).toLocaleDateString()}</p>
                            </div>
                            <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase ${
                              t.status === 'resolved' 
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                                : t.status === 'in_progress'
                                ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
                                : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            }`}>
                              {t.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
};

export default MyProfile;
