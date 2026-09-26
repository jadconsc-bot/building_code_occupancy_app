import { useEffect } from "react";
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
import { AuthExchangeProvider } from "./contexts/AuthExchangeContext";
import { CookieConsent } from "./components/CookieConsent";
import { OfflineIndicator } from "./components/OfflineIndicator";
import { HelpPanel } from "./components/HelpPanel";
import Home from "./pages/Home";
import OccupancyClassifierPage from "./pages/OccupancyClassifierPage";
import SpaceAnalyzerPage from "./pages/SpaceAnalyzerPage";
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
import HomeLanding from "./pages/HomeLanding";
import HomeForm from "./pages/HomeForm";
import HomePreview from "./pages/HomePreview";
import HomeProcessing from "./pages/HomeProcessing";
import HomeReport from "./pages/HomeReport";
import ContractorHub from "./pages/ContractorHub";
import ContractorTool from "./pages/ContractorTool";
import Integrations from "./pages/Integrations";
import SharedProjectView from "./pages/SharedProjectView";
import BriefPage from "./pages/BriefPage";
import { NavigationHeader } from "./components/NavigationHeader";
import { ProjectTabView } from "./components/ProjectTabView";
import { RequireRole } from "./components/RequireRole";
import { HomeReportHistory } from "./components/HomeReportHistory";
import { useLocation } from "wouter";

function BillingSuccess() {
  return (
    <div className="max-w-lg mx-auto px-4 pt-20 text-center space-y-4">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h1 className="text-2xl font-bold text-gray-900">Subscription Activated!</h1>
      <p className="text-gray-600">Your plan is now active. It may take a moment for your account to reflect the new features.</p>
      <a href="/" className="inline-block mt-4 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity">
        Go to Dashboard
      </a>
    </div>
  );
}

function ProjectDetailPage({ params }: { params: { projectId: string } }) {
  const [, setLocation] = useLocation();
  return (
    <ProjectTabView
      projectId={params.projectId ?? ''}
      onNavigate={(route) => setLocation(route)}
      onBack={() => setLocation('/')}
    />
  );
}

function CalculatorsRedirect() {
  const [, navigate] = useLocation();
  useEffect(() => {
    localStorage.setItem("active_tab", "design-tools");
    navigate("/occupancy-classifier", { replace: true });
  }, [navigate]);
  return null;
}

function Router() {
  // make sure to consider if you need authentication for certain routes
  // ProjectTabView route added for individual project detail views
  return (
    <>
      <NavigationHeader />
      <Switch>
        <Route path={"/"} component={Dashboard} />
        <Route path={"/occupancy-classifier"} component={OccupancyClassifierPage} />
        <Route path={"/space-analyzer"} component={SpaceAnalyzerPage} />
        <Route path={"/calculators"} component={CalculatorsRedirect} />
        <Route path={"/project-checklists"} component={ProjectChecklists} />
        <Route path={"/brief"} component={BriefPage} />
        <Route path={"/compliance/:projectId"}>
          <RequireRole minRole="professional" featureName="Compliance Engine">
            <Compliance />
          </RequireRole>
        </Route>
        <Route path={"/compliance"}>
          <RequireRole minRole="professional" featureName="Compliance Engine">
            <Compliance />
          </RequireRole>
        </Route>
        <Route path={"/rule-management"} component={RuleManagement} />
        <Route path={"/calculation-history"}>
          <RequireRole minRole="professional" featureName="Calculation History">
            <CalculationHistory />
          </RequireRole>
        </Route>
        <Route path={"/clients"}>
          <RequireRole minRole="professional" featureName="Client Management">
            <ClientsManagement />
          </RequireRole>
        </Route>
        <Route path={"/sharing"} component={ProjectSharing} />
        <Route path={"/versions"} component={CalculationVersioning} />
        <Route path={"/billing"} component={Billing} />
        <Route path={"/billing/success"} component={BillingSuccess} />
        <Route path={"/shared/:token"} component={SharedProjectView} />
        <Route path={"/verify"} component={VerificationPortal} />
        <Route path={"/admin"} component={AdminDashboard} />
        <Route path={"/terms"} component={TermsOfService} />
        <Route path={"/documentation"} component={Documentation} />
        <Route path={"/drawing-analyzer"}>
          <RequireRole minRole="professional" featureName="Drawing Analyzer">
            <DrawingAnalyzerPage />
          </RequireRole>
        </Route>
        <Route path={"/settings"} component={Settings} />
        <Route path={"/project/:projectId"} component={ProjectDetailPage} />
        <Route path={"/home"} component={HomeLanding} />
        <Route path={"/home/reports"}>
          <RequireRole minRole="home_user" featureName="Home Report History">
            <HomeReportHistory />
          </RequireRole>
        </Route>
        <Route path={"/home/preview"} component={HomePreview} />
        <Route path={"/home/processing"} component={HomeProcessing} />
        <Route path={"/home/report/:rawToken"} component={HomeReport} />
        <Route path={"/home/:projectType"} component={HomeForm} />
        <Route path={"/contractor/:tool"} component={ContractorTool} />
        <Route path={"/contractor"} component={ContractorHub} />
        <Route path={"/integrations"}>
          <RequireRole minRole="professional" featureName="Integrations">
            <Integrations />
          </RequireRole>
        </Route>
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
      <CookieConsent />
      <AuthExchangeProvider>
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
      </AuthExchangeProvider>
    </ErrorBoundary>
  );
}

export default App;
