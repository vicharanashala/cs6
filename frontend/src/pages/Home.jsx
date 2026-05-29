import { useState } from "react";
import { 
  UserPlus, DollarSign, BookOpen, Home as HomeIcon, Briefcase, 
  FileText, Building, Award, Cpu, Heart, 
  Library, Compass, Globe, ArrowRight, Search, Zap, ShieldCheck, HelpCircle 
} from "lucide-react";

// Static mapping for category icons and calibrated WCAG AA contrast colors
const getCategoryMeta = (index) => {
  const meta = [
    { icon: UserPlus, colorClass: "bg-violet-50 text-violet-700 border-violet-200" },
    { icon: DollarSign, colorClass: "bg-emerald-50 text-emerald-700 border-emerald-200" },
    { icon: BookOpen, colorClass: "bg-blue-50 text-blue-700 border-blue-200" },
    { icon: HomeIcon, colorClass: "bg-orange-50 text-orange-700 border-orange-200" },
    { icon: Briefcase, colorClass: "bg-indigo-50 text-indigo-700 border-indigo-200" },
    { icon: FileText, colorClass: "bg-red-50 text-red-700 border-red-200" },
    { icon: Building, colorClass: "bg-teal-50 text-teal-700 border-teal-200" },
    { icon: Award, colorClass: "bg-amber-50 text-amber-800 border-amber-200" },
    { icon: Cpu, colorClass: "bg-cyan-50 text-cyan-700 border-cyan-200" },
    { icon: Heart, colorClass: "bg-rose-50 text-rose-700 border-rose-200" },
    { icon: Library, colorClass: "bg-sky-50 text-sky-700 border-sky-200" },
    { icon: Compass, colorClass: "bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200" },
    { icon: Globe, colorClass: "bg-yellow-50 text-yellow-700 border-yellow-200" }
  ];
  return meta[index % meta.length];
};

const Home = ({ categories = [], onCategorySelect, onAskClick }) => {
  const [searchQuery, setSearchQuery] = useState("");

  // Instant card filter based on keywords entered in hero search input
  const filteredCategories = categories.filter(cat => 
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    cat.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="mx-auto max-w-6xl px-6 py-16">
      
      {/* ─── Hero Section ────────────────────────────────────────── */}
      <section className="mb-16 text-center max-w-3xl mx-auto" id="hero">
        <h1 className="mb-4 text-4xl sm:text-5xl font-black tracking-tight leading-tight text-white">
          Find answers to your{" "}
          <span className="bg-gradient-to-r from-primary-400 to-purple-400 bg-clip-text text-transparent">
            Questions, Instantly.
          </span>
        </h1>
        
        <p className="mx-auto max-w-xl text-sm sm:text-base text-gray-400 mb-8 font-normal leading-relaxed">
          Search verified knowledge bases, find immediate resolutions to common campus issues, or contribute your own queries to the student crowdsourced portal.
        </p>

        {/* Hero Search Bar */}
        <div className="relative max-w-lg mx-auto shadow-2xl rounded-xl">
          <Search className="absolute top-4 left-4 h-5 w-5 text-gray-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type keywords to filter categories..."
            className="w-full rounded-xl border border-white/10 bg-surface-light py-3.5 pl-12 pr-16 text-sm text-white placeholder-gray-600 focus:border-primary-500 focus:outline-none"
          />
          <button className="absolute right-2 top-2 rounded-lg bg-primary-500 p-2 text-white hover:bg-primary-600 active:scale-95 transition-all duration-300">
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
                className="inline-flex items-center gap-1.5 rounded-full border border-white/5 bg-surface-light/40 px-4.5 py-1.5 text-xs font-medium text-gray-300 backdrop-blur-sm"
              >
                <Icon size={12} className="text-primary-400" />
                {badge.label}
              </span>
            );
          })}
        </div>
      </section>

      {/* ─── Category Grid ────────────────────────────────────────── */}
      <section className="mb-12">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-sm font-bold tracking-wider text-gray-400 uppercase">
            Browse Category Portals ({filteredCategories.length})
          </h3>
        </div>

        {filteredCategories.length === 0 ? (
          <div className="rounded-xl border border-white/5 bg-surface-light p-12 text-center">
            <p className="text-gray-400 font-medium">No categories matched your search criteria</p>
            <p className="text-gray-600 text-xs mt-1">Try searching for other keywords or ask a new question instead.</p>
            <button
              onClick={onAskClick}
              className="mt-6 inline-flex items-center gap-1.5 rounded-lg bg-primary-500 py-2 px-4 text-xs font-semibold text-white hover:bg-primary-600 transition-colors"
            >
              Submit Question
            </button>
          </div>
        ) : (
          <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
            {filteredCategories.map((cat, index) => {
              const { icon: Icon, colorClass } = getCategoryMeta(index);
              const formattedNumber = String(index + 1).padStart(2, "0");

              return (
                <div
                  key={cat._id}
                  onClick={() => onCategorySelect(cat)}
                  className="group relative flex flex-col justify-between rounded-2xl border border-slate-100 bg-white p-6 shadow-sm cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-md"
                >
                  {/* Absolute Card Numbering */}
                  <span className="absolute top-4 right-4 text-[10px] font-black text-slate-300">
                    {formattedNumber}
                  </span>

                  <div>
                    {/* Centered, softly tinted icon container */}
                    <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl border ${colorClass}`}>
                      <Icon size={22} strokeWidth={2} />
                    </div>

                    {/* Descriptive Heading */}
                    <h4 className="text-base font-extrabold text-slate-900 leading-tight">
                      {cat.name}
                    </h4>

                    {/* Description Text */}
                    <p className="mt-2 text-xs font-normal text-slate-500 leading-relaxed pr-2">
                      {cat.description}
                    </p>
                  </div>

                  {/* Footer (Question Count & Circular Arrow Icon Button) */}
                  <div className="mt-6 flex items-center justify-between border-t border-slate-50 pt-4">
                    <span className="text-[10px] font-bold text-slate-400">
                      {cat.questionCount || 0} solutions
                    </span>
                    <button className="flex h-7 w-7 items-center justify-center rounded-full bg-slate-100 text-slate-700 hover:bg-primary-500 hover:text-white transition-colors duration-300 shadow-sm">
                      <ArrowRight size={14} className="transition-transform group-hover:translate-x-0.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

    </div>
  );
};

export default Home;
