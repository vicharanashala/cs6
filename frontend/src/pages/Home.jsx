import { useState, useEffect } from "react";
import { 
  UserPlus, DollarSign, BookOpen, Home as HomeIcon, Briefcase, 
  FileText, Building, Award, Cpu, Heart, 
  Library, Compass, Globe, ArrowRight, Search, Zap, ShieldCheck, HelpCircle, Eye,
  Clock, Laptop, Bot, Users, Notebook
} from "lucide-react";
import api from "../api/axios";

// Static mapping for category icons and calibrated WCAG AA contrast colors
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

// Static mapping for category descriptions based on the section name
const categoryDescriptions = {
  // Database exact versions
  "About the internship": "Learn what VINS is, who can apply, internship phases, eligibility, and important participation rules.",
  "Timing and dates": "Understand internship duration, start-date flexibility, exam-related policies, and key deadlines.",
  "NOC (No Objection Certificate)": "Everything about obtaining, submitting, verifying, and troubleshooting your NOC requirements.",
  "Selection, offer letter, and certificate": "Check selection status, accept offers correctly, manage dates, and understand certification policies.",
  "Work, mentorship, and projects": "Explore project domains, daily expectations, mentor assignments, tools, and work structure.",
  "Code of conduct — communication channels": "Official communication channels, escalation methods, and important conduct guidelines.",
  "Interviews Related": "Solutions for interview completion, dashboard status, and interview-related issues.",
  "Certificate": "Details about certificates, verification, internship credit, recommendations, and delivery format.",
  "Rosetta — your internship journal": "Learn about the daily reflection journal, submission process, and completion requirements.",
  "Phase 1 — coursework, Vibe LMS, and live sessions": "Information on mandatory courses, exemptions, registrations, and live learning sessions.",
  "Yaksha Chat Related": "Help with accessing and using the Yaksha support and guidance system.",
  "ViBe Platform": "Login help, course access, troubleshooting, proctoring rules, progress tracking, and platform usage.",
  "Team Formation": "Team creation rules, project allocation, collaboration guidelines, and mentor assignment process.",

  // User alternate versions
  "About the Internship": "Learn what VINS is, who can apply, internship phases, eligibility, and important participation rules.",
  "Timing & Dates": "Understand internship duration, start-date flexibility, exam-related policies, and key deadlines.",
  "Selection, Offer Letter & Certificate": "Check selection status, accept offers correctly, manage dates, and understand certification policies.",
  "Work, Mentorship & Projects": "Explore project domains, daily expectations, mentor assignments, tools, and work structure.",
  "Communication & Code of Conduct": "Official communication channels, escalation methods, and important conduct guidelines.",
  "Interview Related": "Solutions for interview completion, dashboard status, and interview-related issues.",
  "Rosetta Journal": "Learn about the daily reflection journal, submission process, and completion requirements.",
  "Phase 1: Coursework & Live Sessions": "Information on mandatory courses, exemptions, registrations, and live learning sessions.",
  "Yaksha Chat": "Help with accessing and using the Yaksha support and guidance system."
};

const Home = ({ categories = [], onCategorySelect, onAskClick, onQuestionSelect }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState({ faqs: [], questions: [] });
  const [isSearching, setIsSearching] = useState(false);

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

    const delayDebounce = setTimeout(() => {
      performSearch();
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const filteredCategories = categories;

  return (
    <div className="mx-auto max-w-6xl px-6 pb-16">
      
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="mb-16 text-center hero-gradient rounded-3xl py-16 px-6 relative overflow-hidden max-w-4xl mx-auto" id="hero">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-48 bg-primary-400/10 rounded-full blur-3xl animate-glow-pulse pointer-events-none" />
        <div className="relative z-10">
          <span className="inline-block mb-5 text-[11px] uppercase tracking-[0.2em] text-primary-400 font-medium px-4 py-1.5 rounded-full border border-primary-500/20 bg-primary-500/5">
            Everything you need to know
          </span>
          <h1 className="mb-4 text-4xl sm:text-5xl font-black tracking-tight leading-tight text-white">
            Find answers to your{" "}
            <br className="hidden sm:block" />
            <span className="text-gradient-hero">
              Questions, Instantly.
            </span>
          </h1>
          
          <p className="mx-auto max-w-xl text-sm sm:text-base text-gray-400 mb-8 font-normal leading-relaxed">
            Search verified knowledge bases, find immediate resolutions to common campus issues, or contribute your own queries to the student crowdsourced portal.
          </p>

          {/* Hero Search Bar */}
          <div className="relative max-w-xl mx-auto shadow-2xl rounded-xl">
            <Search className="absolute top-4 left-4 h-5 w-5 text-gray-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Type keywords to filter categories..."
              className="w-full rounded-xl border border-white/10 bg-surface-light/80 backdrop-blur-sm py-3.5 pl-12 pr-16 text-sm text-white placeholder-gray-600 focus:border-primary-500/40 focus:outline-none focus:glow-cyan-subtle transition-all"
            />
            <button className="absolute right-2 top-2 rounded-lg btn-cyan p-2 active:scale-95 transition-all duration-300">
              <Search size={16} />
            </button>
          </div>

          {/* ─── Feature Badges ────────────────────────────────────────── */}
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            {[
              { label: "Quick Answers", icon: Zap },
              { label: "Trusted Information", icon: ShieldCheck },
              { label: "24/7 Help", icon: HelpCircle }
            ].map((badge) => {
              const Icon = badge.icon;
              return (
                <span 
                  key={badge.label} 
                  className="inline-flex items-center gap-1.5 rounded-full border border-primary-500/10 bg-primary-500/5 px-4 py-1.5 text-xs font-medium text-gray-300 backdrop-blur-sm"
                >
                  <Icon size={12} className="text-primary-400" />
                  {badge.label}
                </span>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── Search Results or Category Grid ────────────────────────────────────────── */}
      {searchQuery.trim() ? (
        <section className="mb-12 space-y-8 font-sans">
          <div className="flex justify-between items-center border-b border-white/5 pb-4">
            <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase">
              Search Results
            </h3>
          </div>

          {isSearching ? (
            <div className="flex flex-col items-center py-16">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
              <p className="mt-4 text-xs text-gray-500">Searching FAQ and question text index...</p>
            </div>
          ) : searchResults.faqs.length === 0 && searchResults.questions.length === 0 ? (
            <div className="rounded-xl border border-white/5 bg-surface-light p-12 text-center">
              <p className="text-gray-400 font-medium">No results found for "{searchQuery}"</p>
              <p className="text-gray-600 text-xs mt-1">Check spelling or create a new question instead.</p>
              <button
                onClick={onAskClick}
                className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-primary-500 py-2 px-4 text-xs font-semibold text-white hover:bg-primary-600 transition-colors"
              >
                Submit Question
              </button>
            </div>
          ) : (
            <div className="space-y-8">
              
              {/* Verified FAQs Priority list */}
              {searchResults.faqs.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-indigo-400 flex items-center gap-1.5">
                    Verified FAQs
                  </h4>
                  <div className="grid gap-4 grid-cols-1">
                    {searchResults.faqs.map((faq) => (
                      <div 
                        key={faq._id}
                        onClick={() => onQuestionSelect(faq)}
                        className="group relative flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-2xl border border-indigo-500/10 bg-indigo-950/10 p-5 shadow-sm cursor-pointer hover:border-indigo-500/20 hover:bg-indigo-950/20 transition-all duration-300 gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="inline-flex rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-2">
                            Verified FAQ
                          </span>
                          <h4 className="text-base font-bold text-white group-hover:text-primary-300 truncate mb-1">
                            {faq.title}
                          </h4>
                          <p className="text-[10px] text-gray-500">
                            Category: {faq.category?.name} • Promoted on {new Date(faq.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye size={12} />
                            {faq.views}
                          </span>
                          <ArrowRight size={14} className="text-indigo-400 transition-transform group-hover:translate-x-0.5" />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Discussions & Unanswered Questions */}
              {searchResults.questions.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
                    Community Questions
                  </h4>
                  <div className="grid gap-4 grid-cols-1">
                    {searchResults.questions.map((q) => (
                      <div 
                        key={q._id}
                        onClick={() => onQuestionSelect(q)}
                        className="group relative flex flex-col sm:flex-row justify-between items-start sm:items-center rounded-2xl border border-white/5 bg-surface-light p-5 shadow-sm cursor-pointer hover:border-white/10 hover:bg-surface-lighter transition-all duration-300 gap-4"
                      >
                        <div className="min-w-0 flex-1">
                          <span className={`inline-flex rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider mb-2 ${
                            q.status === 'resolved' 
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                          }`}>
                            {q.status}
                          </span>
                          <h4 className="text-base font-bold text-white group-hover:text-primary-300 truncate mb-1">
                            {q.title}
                          </h4>
                          <p className="text-[10px] text-gray-500">
                            Category: {q.category?.name} • Asked by {q.author?.name || q.author?.username} on {new Date(q.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4 shrink-0 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Eye size={12} />
                            {q.views}
                          </span>
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
        <section className="mb-12">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase">
              Browse Category Portals ({filteredCategories.length})
            </h3>
          </div>

          <div className="grid gap-8 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5" style={{ perspective: "1000px" }}>
            {filteredCategories.map((cat, index) => {
              const { icon: Icon, colorClass } = getCategoryMeta(index);
              const formattedNumber = String(index + 1).padStart(2, "0");

              return (
                <div
                  key={cat._id}
                  onClick={() => onCategorySelect(cat)}
                  className="flip-card relative rounded-xl border border-white/5 bg-surface-light hover:border-primary-500/15 shadow-sm cursor-pointer"
                >
                  {/* ── Front Face ── */}
                  <div
                    className="absolute inset-0 flex flex-col justify-between p-4 backface-hidden"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden" }}
                  >
                    <span className="absolute top-3 right-3 text-[10px] font-black text-white/10">
                      {formattedNumber}
                    </span>

                    <div>
                      <div className={`mb-3 flex h-10 w-10 items-center justify-center rounded-lg border ${colorClass}`}>
                        <Icon size={18} strokeWidth={2} />
                      </div>
                      <h4 className="text-sm font-extrabold text-gray-300 leading-tight">
                        {cat.name}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between border-t border-white/5 pt-3">
                      <span className="text-[10px] font-bold text-gray-400">
                        {cat.questionCount || 0} solutions
                      </span>
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-surface-light/5 text-gray-400 shadow-sm">
                        <ArrowRight size={12} />
                      </div>
                    </div>
                  </div>

                  {/* ── Back Face ── */}
                  <div
                    className="absolute inset-0 flex flex-col items-start justify-center p-4 rounded-xl bg-gradient-to-br from-[#034d33] to-[#023c27]"
                    style={{ backfaceVisibility: "hidden", WebkitBackfaceVisibility: "hidden", transform: "rotateY(180deg)" }}
                  >
                    <p className="text-xs font-medium text-gray-400 leading-relaxed line-clamp-5">
                      {cat.description || categoryDescriptions[cat.name] || `Official FAQs for the section: ${cat.name}`}
                    </p>
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
      )}

    </div>
  );
};

export default Home;
