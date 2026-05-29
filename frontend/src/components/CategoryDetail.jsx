import { useState, useEffect } from "react";
import { ArrowLeft, MessageSquare, Eye, Search, PlusCircle, CheckCircle2, ChevronRight } from "lucide-react";
import api from "../api/axios";

const CategoryDetail = ({ category, onBack, onQuestionClick, onAskQuestion, currentUser }) => {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [sortOption, setSortOption] = useState("newest");

  useEffect(() => {
    const fetchCategoryQuestions = async () => {
      try {
        const response = await api.get(`/categories/${category._id}`);
        if (response.data.success) {
          setQuestions(response.data.data.questions || []);
        }
      } catch (error) {
        console.error("Error fetching category questions:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCategoryQuestions();
  }, [category._id]);

  // Handle local sorting and searching of category questions
  const filteredQuestions = questions
    .filter(q => q.title.toLowerCase().includes(searchQuery.toLowerCase()) || q.body.toLowerCase().includes(searchQuery.toLowerCase()))
    .sort((a, b) => {
      if (sortOption === "newest") return new Date(b.createdAt) - new Date(a.createdAt);
      if (sortOption === "oldest") return new Date(a.createdAt) - new Date(b.createdAt);
      if (sortOption === "views") return b.views - a.views;
      return 0;
    });

  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      {/* Back button */}
      <button 
        onClick={onBack}
        className="mb-8 flex items-center gap-2 text-sm font-semibold text-gray-400 hover:text-white transition-colors group"
      >
        <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
        Back to Categories
      </button>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 border-b border-white/5 pb-8 mb-8">
        <div>
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {category.name}
          </h2>
          <p className="mt-2 text-gray-400 text-sm max-w-xl">
            {category.description}
          </p>
        </div>
        <button
          onClick={onAskQuestion}
          className="flex items-center justify-center gap-2 self-start rounded-lg bg-primary-500 py-2.5 px-4 text-sm font-semibold text-white shadow-lg shadow-primary-500/20 hover:bg-primary-600 active:scale-95 transition-all duration-300"
        >
          <PlusCircle size={16} />
          Ask in this Category
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-8">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute top-3 left-3 h-4 w-4 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search questions inside category..."
            className="w-full rounded-lg border border-white/10 bg-surface-light py-2 px-10 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
          />
        </div>

        {/* Sort options */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          <span className="text-xs text-gray-500">Sort:</span>
          <select
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value)}
            className="rounded-lg border border-white/10 bg-surface-light py-1.5 px-3 text-xs text-white focus:outline-none focus:border-primary-500"
          >
            <option value="newest">Newest first</option>
            <option value="oldest">Oldest first</option>
            <option value="views">Most viewed</option>
          </select>
        </div>
      </div>

      {/* Questions list */}
      {loading ? (
        <div className="flex flex-col items-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-500 border-t-transparent" />
          <p className="mt-4 text-sm text-gray-400">Loading questions...</p>
        </div>
      ) : filteredQuestions.length === 0 ? (
        <div className="rounded-xl border border-white/5 bg-surface-light p-12 text-center">
          <p className="text-gray-400 font-medium">No questions found</p>
          <p className="text-gray-600 text-xs mt-1">Be the first to post a question in this category!</p>
          <button
            onClick={onAskQuestion}
            className="mt-6 inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-surface py-2 px-4 text-xs font-semibold text-white hover:bg-surface-lighter transition-colors"
          >
            Create Question
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map((q) => (
            <div 
              key={q._id}
              onClick={() => onQuestionClick(q)}
              className="group relative flex flex-col justify-between rounded-xl border border-white/5 bg-surface-light p-6 shadow-sm cursor-pointer hover:border-white/10 hover:shadow-lg transition-all duration-300"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  {/* Status & tags */}
                  <div className="flex flex-wrap gap-2 items-center mb-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-semibold ${
                      q.status === "resolved" 
                        ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                    }`}>
                      {q.status === "resolved" && <CheckCircle2 size={10} />}
                      {q.status === "resolved" ? "Resolved" : "Open"}
                    </span>
                    {q.isFAQ && (
                      <span className="inline-flex rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 text-[10px] font-semibold">
                        Official FAQ
                      </span>
                    )}
                    {q.tags?.slice(0, 3).map((tag, idx) => (
                      <span key={idx} className="text-[10px] text-gray-500 font-medium">
                        #{tag}
                      </span>
                    ))}
                  </div>
                  
                  {/* Title */}
                  <h4 className="text-lg font-bold text-white group-hover:text-primary-300 transition-colors">
                    {q.title}
                  </h4>
                  
                  {/* Author / Date */}
                  <p className="mt-1 text-xs text-gray-500">
                    Asked by {q.author?.name || q.author?.username || "Anonymous"} • {new Date(q.createdAt).toLocaleDateString()}
                  </p>
                </div>
                
                {/* Stats */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mt-2 sm:mt-0">
                  <span className="flex items-center gap-1" title="Views count">
                    <Eye size={14} />
                    {q.views}
                  </span>
                </div>
              </div>

              {/* Arrow Indicator */}
              <div className="absolute right-6 bottom-6 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300 text-primary-400">
                <ChevronRight size={18} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryDetail;
