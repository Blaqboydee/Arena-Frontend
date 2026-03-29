import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Landing     from "./pages/Landing";
import Lobby       from "./pages/Lobby";
import JoinViaLink from "./pages/JoinViaLink";
import Game        from "./pages/Game";

export default function App() {
  return (
    <BrowserRouter>
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