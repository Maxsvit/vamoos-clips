import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import SubmitClip from "./pages/SubmitClip";
import About from "./pages/About";
import ClipOfMonth from "./pages/ClipOfMonth";
import NotFound from "./pages/NotFound";
import { AuthProvider } from "./context/AuthContext";
import RouteErrorBoundary from "./components/RouteErrorBoundary";

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
            <Route path="/clip-of-month" element={<ClipOfMonth />} />
            <Route path="/*" element={<NotFound />} />
          </Routes>
        </RouteErrorBoundary>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
