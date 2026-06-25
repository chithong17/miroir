import LandingPage from "./pages/LandingPage.jsx";
import StylistPage from "./pages/StylistPage.jsx";
import TryOnPage from "./pages/TryOnPage.jsx";

function App() {
  const pathname = window.location.pathname;

  if (pathname === "/try-on") {
    return <TryOnPage />;
  }

  if (pathname === "/stylist") {
    return <StylistPage />;
  }

  return <LandingPage />;
}

export default App;
