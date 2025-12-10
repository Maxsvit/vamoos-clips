import { NavLink } from "react-router-dom";
import { useState } from "react";
import logo from "../assets/img/logo.jpg";

function NavBar() {
  const [isOpen, setIsOpen] = useState(false);

  const linkBtn =
    "px-5 py-2 rounded-2xl text-[15px] text-white font-bold " +
    "bg-gradient-to-br from-violet-500 to-fuchsia-500 " +
    "hover:from-violet-400 hover:to-fuchsia-400 " +
    "border border-white/10 shadow-[0_4px_20px_rgba(139,92,246,.25)] " +
    "transition-all duration-200 hover:shadow-[0_6px_26px_rgba(139,92,246,.35)] hover:translate-y-[-1px]";

  const awardsLink =
    "px-5 py-2 rounded-2xl text-[15px] text-white font-bold " +
    "bg-gradient-to-br from-amber-500 to-yellow-500 " +
    "hover:from-amber-400 hover:to-yellow-400 " +
    "border border-amber-300/20 shadow-[0_4px_20px_rgba(251,191,36,.3)] " +
    "transition-all duration-200 hover:shadow-[0_6px_26px_rgba(251,191,36,.5)] hover:translate-y-[-1px]";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0c0224] shadow-[0_0_15px_rgba(139,92,246,0.4)]">
      <div className="mx-auto max-w-7xl px-4 py-3 flex items-center justify-between">
        <NavLink to="/">
          <img
            src={logo}
            alt="Logo"
            className="w-[56px] rounded-2xl shadow-[0_0_15px_rgba(139,92,246,0.7)] hover:shadow-[0_0_25px_rgba(139,92,246,0.9)] transition-shadow duration-300"
          />
        </NavLink>

        <button
          className="text-white text-3xl md:hidden"
          onClick={() => setIsOpen(!isOpen)}
        >
          ☰
        </button>

        <div
          className={`${isOpen ? "flex" : "hidden"} md:flex gap-3  
             absolute md:static flex-col items-start md:flex-row top-full right-0 md:right-0 mt-0 md:mt-0
             bg-[#0c0224]/95 md:bg-transparent backdrop-blur md:backdrop-blur-0
             p-3 md:p-0 rounded-2xl`}
        >
          <NavLink to="/submit" className={linkBtn}>
            Додати кліп 🚀
          </NavLink>

          <a
            href="https://send.monobank.ua/jar/2a8TQ3Q4UJ"
            target="_blank"
            rel="noopener noreferrer"
            className={linkBtn}
          >
            Підтримати канал 💰
          </a>

          <NavLink to="/about" className={linkBtn}>
            Про нас 👥
          </NavLink>
          <NavLink to="/viewers-choice" className={awardsLink}>
            Viewers Choice 2025 🏆
          </NavLink>
          
        </div>
      </div>
    </nav>
  );
}
export default NavBar;
