import { useLocation } from "react-router-dom";
import SiteHeader from "./SiteHeader";

/** Загальна шапка. Сторінки Viewers Choice рендерять її самі (під своєю стрічкою). */
function NavBar() {
  const { pathname } = useLocation();
  if (pathname.startsWith("/viewers-choice")) return null;
  return <SiteHeader />;
}
export default NavBar;
