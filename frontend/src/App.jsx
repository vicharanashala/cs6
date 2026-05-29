import { useState, useEffect } from "react";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import CategoryDetail from "./components/CategoryDetail";
import QuestionDetail from "./components/QuestionDetail";
import MyProfile from "./components/MyProfile";
import AuthModal from "./components/AuthModal";
import QuestionModal from "./components/QuestionModal";
import api from "./api/axios";

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [viewState, setViewState] = useState("home"); // home | category | question | profile
  const [backView, setBackView] = useState("home");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [categories, setCategories] = useState([]);
  
  // Modals state
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isQuestionOpen, setIsQuestionOpen] = useState(false);

  useEffect(() => {
    // Load authentication context
    const token = localStorage.getItem("token");
    const userJson = localStorage.getItem("user");
    if (token && userJson) {
      try {
        setCurrentUser(JSON.parse(userJson));
      } catch (e) {
        console.error("Failed to parse user session", e);
        localStorage.removeItem("token");
        localStorage.removeItem("user");
      }
    }

    // Fetch categories
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const response = await api.get("/categories");
      if (response.data.success) {
        setCategories(response.data.data || []);
      }
    } catch (error) {
      console.error("Failed to load categories:", error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    setViewState("home");
  };

  const handleAskQuestionClick = () => {
    if (!currentUser) {
      setIsAuthOpen(true);
    } else {
      setIsQuestionOpen(true);
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-surface text-gray-100 min-h-screen">
      <Navbar 
        currentUser={currentUser}
        onLoginClick={() => setIsAuthOpen(true)}
        onRegisterClick={() => setIsAuthOpen(true)}
        onAskClick={handleAskQuestionClick}
        onLogout={handleLogout}
        onProfileClick={() => setViewState("profile")}
        onHomeClick={() => setViewState("home")}
      />

      {/* Main Content Router */}
      <main className="flex-1">
        {viewState === "home" && (
          <Home 
            categories={categories}
            onCategorySelect={(cat) => {
              setSelectedCategory(cat);
              setBackView("home");
              setViewState("category");
            }}
            onAskClick={handleAskQuestionClick}
          />
        )}

        {viewState === "category" && selectedCategory && (
          <CategoryDetail 
            category={selectedCategory}
            onBack={() => setViewState("home")}
            onQuestionClick={(q) => {
              setSelectedQuestion(q);
              setBackView("category");
              setViewState("question");
            }}
            onAskQuestion={handleAskQuestionClick}
            currentUser={currentUser}
          />
        )}

        {viewState === "question" && selectedQuestion && (
          <QuestionDetail 
            question={selectedQuestion}
            onBack={() => setViewState(backView || "category")}
            currentUser={currentUser}
            onAuthRequired={() => setIsAuthOpen(true)}
          />
        )}

        {viewState === "profile" && currentUser && (
          <MyProfile 
            currentUser={currentUser}
            onBack={() => setViewState("home")}
            onQuestionClick={(q) => {
              setSelectedQuestion(q);
              setBackView("profile");
              setViewState("question");
            }}
            onAskClick={handleAskQuestionClick}
          />
        )}
      </main>

      {/* Modals */}
      <AuthModal 
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={(user) => setCurrentUser(user)}
      />

      <QuestionModal 
        isOpen={isQuestionOpen}
        onClose={() => setIsQuestionOpen(false)}
        categories={categories}
        onQuestionCreated={(newQ) => {
          // Re-fetch categories to update counts on home
          fetchCategories();
          // Navigate to the category of the new question
          const matchCat = categories.find(c => c._id === newQ.category);
          if (matchCat) {
            setSelectedCategory(matchCat);
            setViewState("category");
          }
        }}
      />
    </div>
  );
}

export default App;
