import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import { PreferencesProvider } from "@/contexts/PreferencesContext";
import { SubscriptionProvider } from "@/contexts/SubscriptionContext";
import { BrandingProvider } from "@/contexts/BrandingContext";
import { AppProvider } from "@/contexts/AppContext";

import PrivateRoute from "@/components/common/PrivateRoute";
import Index from "./pages/Index";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import ProfilePage from "./pages/ProfilePage";
import TransactionsPage from "./pages/TransactionsPage";
import GoalsPage from "./pages/GoalsPage";
import ReportsPage from "./pages/ReportsPage";

import CategoriesPage from "./pages/CategoriesPage";
import PlansPage from "./pages/PlansPage";
import CheckoutPage from "./pages/CheckoutPage";
import PaymentSuccessPage from "./pages/PaymentSuccessPage";
import ReferralPage from "./pages/ReferralPage";

import AdminDashboard from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";
import AdminRoute from "./components/admin/AdminRoute";
import "./App.css";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <BrandingProvider>
          <PreferencesProvider>
            <SubscriptionProvider>
              <AppProvider>
                <BrowserRouter>
                  <Routes>
                    {/* Public routes */}
                    <Route path="/" element={<LandingPage />} />
                    <Route path="/landing" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />

                    <Route
                      path="/forgot-password"
                      element={<ForgotPasswordPage />}
                    />
                    <Route
                      path="/reset-password"
                      element={<ResetPasswordPage />}
                    />
                    <Route path="/plans" element={<PlansPage />} />
                    <Route
                      path="/checkout/:planType"
                      element={<CheckoutPage />}
                    />
                    <Route
                      path="/payment-success"
                      element={<PaymentSuccessPage />}
                    />

                    {/* Protected routes - require authentication */}
                    <Route
                      path="/dashboard"
                      element={
                        <PrivateRoute>
                          <Index />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/profile"
                      element={
                        <PrivateRoute>
                          <ProfilePage />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/transactions"
                      element={
                        <PrivateRoute>
                          <TransactionsPage />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/goals"
                      element={
                        <PrivateRoute>
                          <GoalsPage />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/reports"
                      element={
                        <PrivateRoute>
                          <ReportsPage />
                        </PrivateRoute>
                      }
                    />

                    <Route
                      path="/categories"
                      element={
                        <PrivateRoute>
                          <CategoriesPage />
                        </PrivateRoute>
                      }
                    />
                    <Route
                      path="/referral"
                      element={
                        <PrivateRoute>
                          <ReferralPage />
                        </PrivateRoute>
                      }
                    />

                    {/* Admin routes - require admin role */}
                    <Route
                      path="/admin"
                      element={
                        <AdminRoute>
                          <AdminDashboard />
                        </AdminRoute>
                      }
                    />

                    {/* Catch all route */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
                <Toaster />
                <Sonner />
              </AppProvider>
            </SubscriptionProvider>
          </PreferencesProvider>
        </BrandingProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
