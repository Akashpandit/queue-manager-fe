
import { Routes, Route, Link } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Onboarding from "./pages/Onboarding.jsx";
import ShopPage from "./pages/ShopPage.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import DisplayBoard from "./pages/DisplayBoard.jsx";
import CustomerQueue from "./pages/CustomerQueue.jsx";
import EditShop from "./pages/EditShop.jsx";

import AppHeader from "./components/AppHeader.jsx";

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/register" element={<Onboarding />} />
      <Route path="/shop/:publicId" element={<ShopPage />} />
      <Route path="/shop/:publicId/manage" element={<Dashboard />} />
      <Route path="/display/:publicId" element={<DisplayBoard />} />
      <Route path="/q/:publicId" element={<CustomerQueue />} />
      <Route path="/shop/:publicId/edit" element={<EditShop />} />

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
