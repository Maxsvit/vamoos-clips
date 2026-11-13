import "./index.css";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import SubmitClip from "./pages/SubmitClip";
import About from "./pages/About";
import ClipOfMonth from "./pages/ClipOfMonth";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import RouteErrorBoundary from "./components/RouteErrorBoundary";
import { CLIP_OF_MONTH_ENABLED, VIEWERS_CHOICE_ENABLED } from "./lib/features";
import ViewersChoiceHome from "./pages/viewers-choice/ViewersChoiceHome";
import ViewersChoiceVote from "./pages/viewers-choice/ViewersChoiceVote";
import ViewersChoiceResults from "./pages/viewers-choice/ViewersChoiceResults";
import ViewersChoiceAdmin from "./pages/viewers-choice/ViewersChoiceAdmin";

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <NavBar />
        <RouteErrorBoundary>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/submit" element={<SubmitClip />} />
            <Route path="/about" element={<About />} />
            <Route
              path="/clip-of-month"
              element={
                CLIP_OF_MONTH_ENABLED ? (
                  <ClipOfMonth />
                ) : (
                  <Navigate to="/" replace />
                )
              }
            />
            {VIEWERS_CHOICE_ENABLED && (
              <>
                <Route path="/viewers-choice" element={<ViewersChoiceHome />} />
                <Route path="/viewers-choice/vote" element={<ViewersChoiceVote />} />
                <Route path="/viewers-choice/results" element={<ViewersChoiceResults />} />
                <Route path="/viewers-choice/admin" element={<ViewersChoiceAdmin />} />
              </>
            )}
            <Route path="/*" element={<NotFound />} />
          </Routes>
        </RouteErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
