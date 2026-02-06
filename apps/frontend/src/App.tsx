import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import ActionsOverview from "./pages/ActionsOverview";
import ActionDetail from "./pages/ActionDetail";
import PlaceholderPage from "./pages/PlaceholderPage";
import RoiSettingsPage from "./pages/RoiSettings";
import VariablesList from "./pages/VariablesList";
import VariableDetail from "./pages/VariableDetail";
import RoiDashboard from "./pages/RoiDashboard";

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route
          path="/strategy/esg-hub/actions"
          element={<ActionsOverview />}
        />
        <Route
          path="/strategy/esg-hub/actions/:actionId"
          element={<ActionDetail />}
        />
        <Route
          path="/strategy/esg-hub/goals"
          element={<PlaceholderPage title="Ziele" />}
        />
        <Route
          path="/strategy/esg-hub/kpis"
          element={<PlaceholderPage title="KPIs" />}
        />
        <Route
          path="/strategy/esg-hub/roi-settings"
          element={<RoiSettingsPage />}
        />
        <Route
          path="/strategy/esg-hub/variables"
          element={<VariablesList />}
        />
        <Route
          path="/strategy/esg-hub/variables/:id"
          element={<VariableDetail />}
        />
        <Route
          path="/strategy/esg-hub/roi-dashboard"
          element={<RoiDashboard />}
        />
        <Route
          path="*"
          element={
            <Navigate to="/strategy/esg-hub/actions" replace />
          }
        />
      </Route>
    </Routes>
  );
}
