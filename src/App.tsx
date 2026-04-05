import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Layout } from "@/components/Layout";
import { AuthGuard } from "@/components/AuthGuard";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider } from "@/contexts/AuthContext";
import Dashboard from "@/pages/Dashboard";
import Reviews from "@/pages/Reviews";
import ReviewDetail from "@/pages/ReviewDetail";
import BrandVoice from "@/pages/BrandVoice";
import Insights from "@/pages/Insights";
import SettingsPage from "@/pages/Settings";
import BackfillQueue from "@/pages/BackfillQueue";
import NotFound from "@/pages/NotFound";
import GBPCallback from "@/pages/GBPCallback";
import Login from "@/pages/Login";
import { useReviewStore } from "@/stores/useReviewStore";
import { useLocationStore } from "@/stores/useLocationStore";

const queryClient = new QueryClient();

function DataLoader() {
  const fetchAll = useReviewStore((s) => s.fetchAll);
  const fetchLocations = useLocationStore((s) => s.fetchLocations);

  useEffect(() => {
    fetchLocations();
    fetchAll();
  }, [fetchLocations, fetchAll]);

  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BrowserRouter>
          <ErrorBoundary>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/auth/gbp/callback" element={<GBPCallback />} />

              {/* Protected routes — all wrapped in AuthGuard + Layout */}
              <Route
                path="/*"
                element={
                  <AuthGuard>
                    <DataLoader />
                    <Layout>
                      <ErrorBoundary>
                        <Routes>
                          <Route path="/" element={<Dashboard />} />
                          <Route path="/reviews" element={<Reviews />} />
                          <Route path="/reviews/:id" element={<ReviewDetail />} />
                          <Route path="/brand-voice" element={<BrandVoice />} />
                          <Route path="/insights" element={<Insights />} />
                          <Route path="/settings" element={<SettingsPage />} />
                          <Route path="/backfill" element={<BackfillQueue />} />
                          <Route path="*" element={<NotFound />} />
                        </Routes>
                      </ErrorBoundary>
                    </Layout>
                  </AuthGuard>
                }
              />
            </Routes>
          </ErrorBoundary>
        </BrowserRouter>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
