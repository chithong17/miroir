import LandingPage from "./pages/LandingPage.jsx";
import TryOnPage from "./pages/TryOnPage.jsx";

function App() {
  const pathname = window.location.pathname;

  if (pathname === "/try-on") {
    return <TryOnPage />;
  }

  return <LandingPage />;
}

export default App;
