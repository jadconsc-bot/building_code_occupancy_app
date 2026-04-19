import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import { ComparisonProvider } from "./contexts/ComparisonContext";
import { CalculationHistoryProvider } from "./contexts/CalculationHistoryContext";
import { HelpSystemProvider } from "./contexts/HelpSystemContext";
import { AuthHydrationProvider } from "./contexts/AuthHydrationContext";
import { CookieConsent } from "./components/CookieConsent";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { HelpPanel } from "./components/HelpPanel";
import { useClerkSessionExchange } from "./_core/hooks/useClerkSessionExchange";
import Home from "./pages/Home";
import OccupancyClassifierPage from "./pages/OccupancyClassifierPage";
import ProjectChecklists from "./pages/ProjectChecklists";
import Compliance from "./pages/Compliance";
import RuleManagement from "./pages/RuleManagement";
import CalculationHistory from "./pages/CalculationHistory";
import Dashboard from "./pages/Dashboard";
import AdminDashboard from "./pages/AdminDashboard";
import ClientsManagement from "./pages/ClientsManagement";
import ProjectSharing from "./pages/ProjectSharing";
import CalculationVersioning from "./pages/CalculationVersioning";
import Billing from "./pages/Billing";
import VerificationPortal from "./pages/VerificationPortal";
import TermsOfService from "./pages/TermsOfService";
import Documentation from "./pages/Documentation";
import DrawingAnalyzerPage from "./pages/DrawingAnalyzerPage";
import Settings from "./pages/Settings";
import { NavigationHeader } from "./components/NavigationHeader";
import { ProjectTabView } from "./components/ProjectTabView";
import { useLocation } from "wouter";

function Router() {
  // make sure to consider if you need authentication for certain routes
  // ProjectTabView route added for individual project detail views
  return (
    <>
      <NavigationHeader />
      <Switch>
        <Route path={"/"} component={Dashboard} />
        <Route path={"/occupancy-classifier"} component={OccupancyClassifierPage} />
        <Route path={"/project-checklists"} component={ProjectChecklists} />
        <Route path={"/compliance/:projectId"} component={Compliance} />
        <Route path={"/compliance"} component={Compliance} />
        <Route path={"/rule-management"} component={RuleManagement} />
        <Route path={"/calculation-history"} component={CalculationHistory} />
        <Route path={"/clients"} component={ClientsManagement} />
        <Route path={"/sharing"} component={ProjectSharing} />
        <Route path={"/versions"} component={CalculationVersioning} />
        <Route path={"/billing"} component={Billing} />
        <Route path={"/verify"} component={VerificationPortal} />
        <Route path={"/admin"} component={AdminDashboard} />
        <Route path={"/terms"} component={TermsOfService} />
        <Route path={"/documentation"} component={Documentation} />
        <Route path={"/drawing-analyzer"} component={DrawingAnalyzerPage} />
        <Route path={"/settings"} component={Settings} />
        <Route path={"/project/:projectId"} component={({ projectId }: any) => {
          const [, setLocation] = useLocation();
          return (
            <ProjectTabView
              projectId={projectId}
              onNavigate={(route, params) => setLocation(route)}
              onBack={() => setLocation('/projects')}
            />
          );
        }} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  // AUTH-MIGRATE-001 / BUG-FIX-AUTH-011: Run session exchange before AuthHydrationProvider
  // gates the tree. This breaks the circular dependency: exchange no longer needs to wait
  // for isHydrated=true, so auth.me can fire with a valid cookie on the first attempt.
  useClerkSessionExchange();

  return (
    <ErrorBoundary>
      <CookieConsent />
      <AuthHydrationProvider>
        <ThemeProvider
          defaultTheme="light"
          switchable
        >
          <ProjectProvider>
            <ComparisonProvider>
              <CalculationHistoryProvider>
                <HelpSystemProvider>
                  <TooltipProvider>
                    <Toaster />
                    <OfflineIndicator />
                    <HelpPanel />
                    <Router />
                  </TooltipProvider>
                </HelpSystemProvider>
              </CalculationHistoryProvider>
            </ComparisonProvider>
          </ProjectProvider>
        </ThemeProvider>
      </AuthHydrationProvider>
    </ErrorBoundary>
  );
}

export default App;
