import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Home from "./pages/Home";
import CustomerHome from "./pages/CustomerHome";
import MealRecording from "./pages/MealRecording";
import AICoach from "./pages/AICoach";
import TrainerDashboard from "./pages/TrainerDashboard";
import AdminPanel from "./pages/AdminPanel";
import RewardsSystem from "./pages/RewardsSystem";
import MealHistory from "./pages/MealHistory";
import WeeklySummary from "./pages/WeeklySummary";
import DietModeSettings from "./pages/DietModeSettings";
import Rewards from "./pages/Rewards";
import CustomerSettings from "./pages/CustomerSettings";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <Switch>
      {/* ホームページ（認証なし） */}
      <Route path={"/"} component={Home} />
      
      {/* 顧客画面（認証必須） */}
      <Route path={"/customer/home"}>
        {() => (
          <DashboardLayout>
            <CustomerHome />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/customer/meal"}>
        {() => (
          <DashboardLayout>
            <MealRecording />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/customer/ai-coach"}>
        {() => (
          <DashboardLayout>
            <AICoach />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/customer/meal-history"}>
        {() => (
          <DashboardLayout>
            <MealHistory />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/customer/weekly"}>
        {() => (
          <DashboardLayout>
            <WeeklySummary />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/customer/diet-settings"}>
        {() => (
          <DashboardLayout>
            <DietModeSettings />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/customer/rewards"}>
        {() => (
          <DashboardLayout>
            <Rewards />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/customer/settings"}>
        {() => (
          <DashboardLayout>
            <CustomerSettings />
          </DashboardLayout>
        )}
      </Route>
      
      {/* トレーナー画面（認証必須） */}
      <Route path={"/trainer/dashboard"}>
        {() => (
          <DashboardLayout>
            <TrainerDashboard />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/trainer/customers"}>
        {() => (
          <DashboardLayout>
            <TrainerDashboard />
          </DashboardLayout>
        )}
      </Route>

      
      {/* 管理者画面（認証必須） */}
      <Route path={"/admin/dashboard"}>
        {() => (
          <DashboardLayout>
            <AdminPanel />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/admin/users"}>
        {() => (
          <DashboardLayout>
            <AdminPanel />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/admin/trainers"}>
        {() => (
          <DashboardLayout>
            <AdminPanel />
          </DashboardLayout>
        )}
      </Route>
      <Route path={"/admin/audit"}>
        {() => (
          <DashboardLayout>
            <AdminPanel />
          </DashboardLayout>
        )}
      </Route>
      
      <Route path={"/404"} component={NotFound} />
      {/* Final fallback route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// NOTE: About Theme
// - Light theme is used for E9th connect
// - Color palette is customized in client/src/index.css
// - Theme is not switchable for now

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
