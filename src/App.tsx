import { BrowserRouter, Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { App as CapacitorApp } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import Landing     from "./pages/Landing";
import Lobby       from "./pages/Lobby";
import JoinViaLink from "./pages/JoinViaLink";
import Game        from "./pages/Game";

// Android hardware back button: go back through pages, minimize from the landing page
function BackButtonHandler() {
  const navigate = useNavigate();

  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    const listener = CapacitorApp.addListener("backButton", ({ canGoBack }) => {
      if (window.location.pathname === "/" || !canGoBack) {
        CapacitorApp.minimizeApp();
      } else {
        navigate(-1);
      }
    });

    return () => {
      listener.then((l) => l.remove());
    };
  }, [navigate]);

  return null;
}

export default function App() {
  return (
    <BrowserRouter>
      <BackButtonHandler />
      <Routes>
        <Route path="/"             element={<Landing />} />
        <Route path="/lobby"        element={<Lobby />} />
        <Route path="/join/:code"   element={<JoinViaLink />} />
        <Route path="/game/:roomId" element={<Game />} />
        <Route path="*"             element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}