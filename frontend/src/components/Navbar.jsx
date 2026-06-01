import { HelpCircle, LogOut, User as UserIcon, Wrench, Sun, Moon } from "lucide-react";

const Navbar = ({ currentUser, onLoginClick, onRegisterClick, onAskClick, onLogout, onProfileClick, onHomeClick, onTroubleshootClick, theme, onToggleTheme }) => {
  return (
    <nav className="sticky top-0 z-50 border-b border-white/10 bg-surface/80 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        
        {/* Logo / Brand */}
        <button 
          onClick={onHomeClick}
          className="flex items-center gap-2 group text-left focus:outline-none" 
          id="nav-brand"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary-400 to-primary-600 text-sm font-bold text-white shadow-lg shadow-primary-500/20 transition-transform group-hover:scale-110">
            ?
          </span>
          <span className="text-lg font-semibold tracking-tight text-white">
            FAQ Portal
          </span>
        </button>

        {/* Nav Links / Actions */}
        <div className="flex items-center gap-4 sm:gap-6">
          <button
            onClick={onAskClick}
            className="flex items-center gap-1.5 rounded-lg border border-white/10 bg-surface py-2 px-3.5 text-xs font-semibold text-white hover:bg-surface-lighter transition-colors"
          >
            <HelpCircle size={14} />
            Submit a Question
          </button>

          {currentUser && (
            <button
              onClick={onTroubleshootClick}
              className="flex items-center gap-1.5 rounded-lg border border-amber-500/20 bg-amber-500/10 py-2 px-3.5 text-xs font-semibold text-amber-300 hover:bg-amber-500/20 transition-colors"
            >
              <Wrench size={14} />
              Troubleshooting
            </button>
          )}

          <button
            onClick={onToggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-surface text-gray-400 hover:text-white transition-colors cursor-pointer"
            title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
          >
            {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
          </button>

          {currentUser ? (
            <div className="flex items-center gap-3 sm:gap-4 border-l border-white/10 pl-4 sm:pl-6">
              {/* User badge */}
              <button 
                onClick={onProfileClick}
                className="flex items-center gap-2 cursor-pointer group hover:opacity-90 transition-opacity focus:outline-none"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary-500/10 text-primary-300 border border-primary-500/20 text-xs font-bold uppercase transition-transform group-hover:scale-105">
                  {currentUser.name?.substring(0, 2) || currentUser.username?.substring(0, 2) || "U"}
                </div>
                <span className="hidden sm:inline text-xs font-semibold text-gray-200 group-hover:text-white transition-colors">
                  {currentUser.name || currentUser.username}
                </span>
              </button>
              
              {/* Logout */}
              <button
                onClick={onLogout}
                className="text-gray-400 hover:text-white transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 border-l border-white/10 pl-4 sm:pl-6">
              <button
                onClick={onLoginClick}
                className="text-xs font-semibold text-gray-300 hover:text-white transition-colors py-1.5 px-3"
              >
                Login
              </button>
              <button
                onClick={onRegisterClick}
                className="rounded-lg btn-cyan py-1.5 px-3.5 text-xs font-semibold text-white transition-colors"
              >
                Sign Up
              </button>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
