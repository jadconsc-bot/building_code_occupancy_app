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
import { OfflineIndicator } from "./components/OfflineIndicator";
import { HelpPanel } from "./components/HelpPanel";
import Home from "./pages/Home";
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
import { NavigationHeader } from "./components/NavigationHeader";

function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <>
      <NavigationHeader />
      <Switch>
        <Route path={"/"} component={Dashboard} />
        <Route path={"/occupancy-classifier"} component={Home} />
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
  return (
    <ErrorBoundary>
      <AuthHydrationProvider>
        <ThemeProvider
          defaultTheme="light"
          // switchable
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
