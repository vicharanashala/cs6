// src/layouts/MainLayout.jsx
// Main layout wrapper — Navbar + page content

import Navbar from "../components/Navbar";

const MainLayout = ({ children }) => {
  return (
    <>
      <Navbar />
      <main className="flex-1">{children}</main>
    </>
  );
};

export default MainLayout;
