import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import ProfileOnboardingPage from "./pages/ProfileOnboardingPage.jsx";
import ShopDashboardPage from "./pages/ShopDashboardPage.jsx";
import TryOnStudioPage from "./pages/TryOnStudioPage.jsx";
import UserAppPage from "./pages/UserAppPage.jsx";

function App() {
  const pathname = window.location.pathname;

  if (pathname === "/try-on") {
    return <TryOnStudioPage />;
  }

  if (pathname === "/stylist") {
    window.location.replace("/app/stylist");
    return null;
  }

  if (pathname === "/login") {
    return <AuthPage mode="login" />;
  }

  if (pathname === "/register") {
    return <AuthPage mode="register" />;
  }

  if (pathname === "/onboarding/profile") {
    return <ProfileOnboardingPage />;
  }

  if (pathname === "/app" || pathname === "/app/products") {
    return <UserAppPage initialView="products" />;
  }

  if (pathname === "/app/outfits") {
    return <UserAppPage initialView="outfits" />;
  }

  if (pathname === "/app/stylist") {
    return <UserAppPage initialView="stylist" />;
  }

  if (pathname === "/app/try-on") {
    return <TryOnStudioPage />;
  }

  if (pathname === "/app/profile") {
    return <UserAppPage initialView="profile" />;
  }

  if (pathname === "/shop/login") {
    window.location.replace("/login");
    return null;
  }

  if (pathname === "/shop/register") {
    return <AuthPage mode="register" />;
  }

  if (pathname === "/shop/dashboard") {
    return <ShopDashboardPage />;
  }

  if (pathname === "/admin/login") {
    window.location.replace("/login");
    return null;
  }

  if (pathname === "/admin/dashboard") {
    return <AdminDashboardPage />;
  }

  return <LandingPage />;
}

export default App;
