
import { Routes, Route, Link, useLocation } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DisplayBoard from "./pages/DisplayBoard.jsx";
import CustomerQueue from "./pages/CustomerQueue.jsx";
import EditShop from "./pages/EditShop.jsx";

import AppHeader from "./components/AppHeader.jsx";
import { RequireAuth, useAuth } from "./auth.jsx";
import AuthPage from "./pages/AuthPage.jsx";
import MyShops from "./pages/MyShops.jsx";
import ShopInsights from "./pages/ShopInsights.jsx";

export default function App() {
  const { pathname } = useLocation();
  const { user, logout } = useAuth();
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<AuthPage mode="login" />} />
      <Route path="/signup" element={<AuthPage mode="signup" />} />
      <Route path="/register" element={<RequireAuth><Onboarding /></RequireAuth>} />
      <Route path="/shop/:publicId" element={<RequireAuth><ShopPage /></RequireAuth>} />
      <Route path="/shop/:publicId/manage" element={<RequireAuth><Dashboard /></RequireAuth>} />
      <Route path="/display/:publicId" element={<DisplayBoard />} />
      <Route path="/q/:publicId" element={<CustomerQueue />} />
      <Route path="/shop/:publicId/edit" element={<RequireAuth><EditShop /></RequireAuth>} />
      <Route path="/shops" element={<RequireAuth><MyShops /></RequireAuth>} />
      <Route path="/shop/:publicId/insights" element={<RequireAuth><ShopInsights/></RequireAuth>} />

      <Route
        path="*"
        element={
          <div className="page">
            <h1>Page not found</h1>
            <Link to="/">Go home</Link>
          </div>
        }
      />
    </Routes>
  );
}
