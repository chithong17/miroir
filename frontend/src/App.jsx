import LandingPage from "./pages/LandingPage.jsx";
import ShopAuthPage from "./pages/ShopAuthPage.jsx";
import ShopDashboardPage from "./pages/ShopDashboardPage.jsx";
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

  if (pathname === "/shop/login") {
    return <ShopAuthPage mode="login" />;
  }

  if (pathname === "/shop/register") {
    return <ShopAuthPage mode="register" />;
  }

  if (pathname === "/shop/dashboard") {
    return <ShopDashboardPage />;
  }

  return <LandingPage />;
}

export default App;
