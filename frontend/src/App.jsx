import AdminDashboardPage from "./pages/AdminDashboardPage.jsx";
import { getAdminToken } from "./api/adminApi.js";
import AuthPage from "./pages/AuthPage.jsx";
import DownloadPage from "./pages/DownloadPage.jsx";
import LandingPage from "./pages/LandingPage.jsx";
import PaymentResultPage from "./pages/PaymentResultPage.jsx";
import ProductDetailPage from "./pages/ProductDetailPage.jsx";
import ProfileOnboardingPage from "./pages/ProfileOnboardingPage.jsx";
import { getShopToken } from "./api/shopApi.js";
import ShopDashboardPage from "./pages/ShopDashboardPage.jsx";
import ShopProductWorkspacePage from "./pages/ShopProductWorkspacePage.jsx";
import ShopPublicPage from "./pages/ShopPublicPage.jsx";
import TryOnStudioPage from "./pages/TryOnStudioPage.jsx";
import UserAppPage from "./pages/UserAppPage.jsx";
import CommercePage from "./pages/CommercePage.jsx";
import ChatPage from "./pages/ChatPage.jsx";
import { getUserToken } from "./api/userApi.js";

function App() {
  const rawPathname = window.location.pathname;
  const pathname = rawPathname.length > 1 ? rawPathname.replace(/\/+$/, "") : rawPathname;

  if (pathname === "/download") {
    return <DownloadPage />;
  }

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

  if (pathname === "/payment/success") {
    return <PaymentResultPage result="success" />;
  }

  if (pathname === "/payment/cancel") {
    return <PaymentResultPage result="cancel" />;
  }

  if (pathname === "/app" || pathname === "/app/products") {
    return <UserAppPage initialView="products" />;
  }

  if (pathname.startsWith("/app/products/")) {
    return <ProductDetailPage productId={decodeURIComponent(pathname.split("/").pop())} />;
  }

  if (pathname === "/app/outfits") {
    return <UserAppPage initialView="outfits" />;
  }

  if (pathname === "/app/favorites") {
    return <UserAppPage initialView="favorites" />;
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

  if (pathname === "/app/cart") return <CommercePage mode="cart" />;
  if (pathname === "/app/checkout") return <CommercePage mode="checkout" />;
  if (pathname === "/app/addresses") return <CommercePage mode="addresses" />;
  if (pathname === "/app/orders") return <CommercePage mode="orders" />;
  if (pathname.startsWith("/app/orders/")) {
    return <CommercePage mode="order" orderId={decodeURIComponent(pathname.split("/").pop())} />;
  }

  if (pathname === "/app/messages" || pathname.startsWith("/app/messages/")) {
    return <ChatPage actorType="user" initialConversationId={pathname.startsWith("/app/messages/") ? decodeURIComponent(pathname.split("/").pop()) : ""} />;
  }

  if (pathname.startsWith("/app/shops/")) {
    return <ShopPublicPage />;
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

  if (pathname === "/shop/messages" || pathname.startsWith("/shop/messages/")) {
    return <ChatPage actorType="shop" initialConversationId={pathname.startsWith("/shop/messages/") ? decodeURIComponent(pathname.split("/").pop()) : ""} />;
  }

  if (pathname.startsWith("/shop/products/")) {
    return <ShopProductWorkspacePage productId={decodeURIComponent(pathname.split("/").pop())} />;
  }

  if (pathname === "/admin/login") {
    window.location.replace("/login");
    return null;
  }

  if (pathname === "/admin/dashboard") {
    return <AdminDashboardPage />;
  }

  if (pathname === "/") {
    if (getAdminToken()) {
      window.location.replace("/admin/dashboard");
      return null;
    }

    if (getShopToken()) {
      window.location.replace("/shop/dashboard");
      return null;
    }

    if (getUserToken()) {
      window.location.replace("/app");
      return null;
    }
  }

  return <LandingPage />;
}

export default App;
