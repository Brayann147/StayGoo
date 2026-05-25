import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./index.css";
import { RouteErrorBoundary } from "./components/RouteErrorBoundary";
import App from "./App.jsx";
import LoginPage from "./LoginPage.jsx";
import RegisterPage from "./RegisterPage.jsx";
import LoaderPreviewPage from "./LoaderPreviewPage.jsx";
import MemberDashboardPage from "./MemberDashboardPage.jsx";
import HostDashboardPage from "./HostDashboardPage.jsx";
import StayDetailPage from "./StayDetailPage.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <RouteErrorBoundary>
        <Routes>
          <Route path="/" element={<App />} />
          <Route path="/login" element={<LoginPage />} />
          <Route
            path="/register"
            element={
              <RouteErrorBoundary>
                <RegisterPage />
              </RouteErrorBoundary>
            }
          />
          <Route path="/loader" element={<LoaderPreviewPage />} />
          <Route path="/member-dashboard" element={<MemberDashboardPage />} />
          <Route path="/host-dashboard" element={<HostDashboardPage />} />
          <Route path="/stay-detail" element={<StayDetailPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </RouteErrorBoundary>
    </BrowserRouter>
  </StrictMode>
);
