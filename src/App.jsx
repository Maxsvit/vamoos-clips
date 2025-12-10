import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import NavBar from "./components/NavBar";
import Home from "./pages/Home";
import SubmitClip from "./pages/SubmitClip";
import About from "./pages/About";
import NotFound from "./pages/NotFound";
import StreamerAwardsPage from "./pages/StreamerAwardsPage";


function App() {
  return (
    <>
      <BrowserRouter>
        <NavBar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/submit" element={<SubmitClip />} />
          <Route path="/about" element={<About />} />
          <Route path="/*" element={<NotFound />} />
          <Route path="/viewers-choice" element={<StreamerAwardsPage />} />
        </Routes>
      </BrowserRouter>
    </>
  );
}

export default App;
