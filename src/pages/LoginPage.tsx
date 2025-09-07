import React, { useState, useEffect, useCallback } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Eye, EyeOff } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { usePreferences } from "@/contexts/PreferencesContext";
import { loginUser } from "@/services/authService";
import { useAdaptiveContext } from "@/hooks/useAdaptiveContext";
import { supabase } from "@/integrations/supabase/client";
import CountrySelector from "@/components/common/CountrySelector";
import { countries, Country, formatPhoneNumber } from "@/utils/countryUtils";
import { applyPhoneMask, getPlaceholderText } from "@/utils/phoneUtils";
import { useBrandingConfig } from "@/hooks/useBrandingConfig";

const LoginPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { t } = usePreferences();
  const { user, isLoading: authLoading } = useAdaptiveContext();
  const { logoUrl, logoAltText } = useBrandingConfig();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Default to Brazil
  const [showPassword, setShowPassword] = useState(false);
  const [isLoginMode, setIsLoginMode] = useState(true);

  const checkUserRoleAndRedirect = useCallback(async () => {
    try {
      console.log("🔍 Starting role check and redirect process...");

      // First, try to get the user's role from the moneyzap_users table directly
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.log("❌ No authenticated user found, redirecting to dashboard");
        navigate("/dashboard", { replace: true });
        return;
      }

      console.log("👤 Authenticated user:", { id: user.id, email: user.email });

      // Add a safety check - if this is a new user or we can't determine role, default to dashboard
      // This prevents any potential issues with role checking from redirecting to admin
      const isNewUser =
        !user.user_metadata || Object.keys(user.user_metadata).length === 0;
      if (isNewUser) {
        console.log(
          "🆕 New user detected, redirecting to dashboard for safety"
        );
        navigate("/dashboard", { replace: true });
        return;
      }

      // Check user role from the moneyzap_users table
      const { data: userData, error: userError } = await supabase
        .from("moneyzap_users")
        .select("role, email, name")
        .eq("id", user.id)
        .single();

      if (userError) {
        console.error("❌ Error fetching user role:", userError);
        // If we can't determine the role, default to regular user for safety
        console.log(
          "⚠️ Could not determine user role, redirecting to dashboard for safety"
        );
        navigate("/dashboard", { replace: true });
        return;
      }

      console.log("📊 User role data:", userData);

      // Additional safety check - verify the user data makes sense
      if (!userData || !userData.role) {
        console.log(
          "⚠️ Invalid user data, redirecting to dashboard for safety"
        );
        navigate("/dashboard", { replace: true });
        return;
      }

      // Debug: Log all the data we're working with
      console.log("🔍 Debug info:", {
        userRole: userData.role,
        userEmail: userData.email,
        userName: userData.name,
        userId: user.id,
        authUserEmail: user.email,
        isRoleAdmin: userData.role === "admin",
        hasEmail: !!userData.email,
        hasName: !!userData.name,
        emailValid: userData.email?.includes("@"),
      });

      // Extra safety check - only allow admin redirect for very specific cases
      // This prevents any potential bugs from incorrectly identifying users as admin
      const isDefinitelyAdmin =
        userData.role === "admin" &&
        userData.email &&
        userData.name &&
        userData.email.includes("@"); // Basic email validation

      console.log("🎯 Admin check result:", {
        isDefinitelyAdmin,
        roleCheck: userData.role === "admin",
        emailCheck: !!userData.email,
        nameCheck: !!userData.name,
        emailValidCheck: userData.email?.includes("@"),
      });

      // Check if user is admin and redirect accordingly
      if (isDefinitelyAdmin) {
        console.log(
          "👑 User is confirmed admin, redirecting to admin dashboard"
        );
        navigate("/admin", { replace: true });
      } else {
        console.log(
          "👤 User is regular user or admin check failed, redirecting to dashboard"
        );
        navigate("/dashboard", { replace: true });
      }
    } catch (error) {
      console.error("❌ Error checking user role:", error);
      // On any error, default to dashboard for safety
      console.log("⚠️ Error occurred, redirecting to dashboard as fallback");
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    if (!authLoading && user) {
      checkUserRoleAndRedirect();
    }
  }, [user, authLoading, checkUserRoleAndRedirect]);

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);
    // Clear whatsapp when country changes
    setWhatsapp("");
  };

  const handleWhatsappChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const maskedValue = applyPhoneMask(value, selectedCountry.code);
    setWhatsapp(maskedValue);
  };

  // Loading overlay component
  const LoadingOverlay = () => {
    if (!isLoading) return null;

    return (
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="flex flex-col items-center gap-2">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="text-sm font-medium">
            {isLoading && error ? "Processando..." : "Autenticando..."}
          </p>
        </div>
      </div>
    );
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isLoginMode) {
      // Handle login
      if (!email || !password) {
        toast({
          title: t("common.error"),
          description: t("errors.fillAllFields"),
          variant: "destructive",
        });
        return;
      }

      try {
        setIsLoading(true);
        const authData = await loginUser(email, password);
        if (authData?.user && authData?.session) {
          await checkUserRoleAndRedirect();
        } else {
          throw new Error("Login successful but no session established");
        }
      } catch (error) {
        console.error("LoginPage: Login error:", error);
        setIsLoading(false);
        let errorMessage = error.message || t("auth.loginError");
        if (error.message?.includes("Invalid login credentials")) {
          errorMessage = t("errors.emailIncorrect");
        } else if (error.message?.includes("Email not confirmed")) {
          errorMessage = "Erro de autenticação. Tente novamente.";
        }
        toast({
          title: t("common.error"),
          description: errorMessage,
          variant: "destructive",
        });
      }
    } else {
      // Handle registration
      if (!email || !password || !fullName || !whatsapp) {
        toast({
          title: t("common.error"),
          description: t("errors.fillAllFields"),
          variant: "destructive",
        });
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Create user account using our custom function with auto-confirmed email
        const { data: functionData, error: signUpError } =
          await supabase.functions.invoke("create-user-account", {
            body: {
              email,
              password,
              full_name: fullName,
              phone: formatPhoneNumber(selectedCountry, whatsapp), // Use utility function to format phone with country code
              country_code: selectedCountry.code,
            },
          });

        if (signUpError) {
          throw signUpError;
        }

        if (!functionData || !functionData.success) {
          throw new Error(
            functionData?.error || "Failed to create user account"
          );
        }

        const authData = {
          user: functionData.user,
          session: null, // No session returned from admin function
        };

        if (!authData.user) {
          throw new Error("Failed to create user account");
        }

        // Since the admin function doesn't return a session, we need to sign in
        // to get a valid session for the user
        console.log("🔄 Signing in user after account creation...");
        const { data: signInData, error: signInError } =
          await supabase.auth.signInWithPassword({
            email,
            password,
          });

        if (signInError) {
          console.error(
            "❌ Error signing in after account creation:",
            signInError
          );
          throw new Error(
            `Failed to sign in after account creation: ${signInError.message}`
          );
        }

        if (!signInData.session) {
          throw new Error("No session returned after sign in");
        }

        // Update authData with the actual session
        authData.session = signInData.session;

        // Account created successfully, show success message
        toast({
          title: "Conta criada com sucesso!",
          description:
            "Sua conta foi criada, confirmada e você foi logado automaticamente.",
        });

        // Since user is already logged in, redirect to dashboard
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 2000);
      } catch (error) {
        console.error("LoginPage: Registration error:", error);
        setIsLoading(false);
        setError(error.message || "Erro ao criar conta. Tente novamente.");

        // Remove loading class on error
        const formElement = document.getElementById("login-form");
        if (formElement) {
          formElement.classList.remove("form-loading");
        }

        let errorMessage = "Erro ao criar conta. Tente novamente.";
        if (error.message?.includes("already registered")) {
          errorMessage = "Este e-mail já está cadastrado. Faça login.";
        } else if (error.message) {
          errorMessage = error.message;
        }

        toast({
          title: t("common.error"),
          description: errorMessage,
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
      {/* Render LoadingOverlay outside the form container */}
      {isLoading && <LoadingOverlay />}

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-md mx-auto">
          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src={logoUrl}
              alt={logoAltText}
              className="h-24 w-auto mx-auto mb-4"
            />
          </div>

          {/* Error Display */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Auth Card */}
          <Card className="border-0 shadow-xl shadow-slate-200/50 overflow-hidden">
            {/* Tab buttons */}
            <div className="flex border-b border-slate-200">
              <button
                type="button"
                className={`flex-1 py-4 text-center font-medium transition-colors ${
                  isLoginMode
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => setIsLoginMode(true)}
              >
                Acessar conta
              </button>
              <button
                type="button"
                className={`flex-1 py-4 text-center font-medium transition-colors ${
                  !isLoginMode
                    ? "text-primary border-b-2 border-primary bg-primary/5"
                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                }`}
                onClick={() => setIsLoginMode(false)}
              >
                Criar conta
              </button>
            </div>

            <CardContent className="p-6">
              {/* Form */}
              <form
                id="login-form"
                onSubmit={handleSubmit}
                className={`space-y-6 ${isLoading ? "form-loading" : ""}`}
              >
                {!isLoginMode && (
                  <>
                    {/* Full Name */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="fullName"
                        className="text-sm font-medium text-slate-700"
                      >
                        Nome completo
                      </Label>
                      <Input
                        id="fullName"
                        name="fullName"
                        type="text"
                        autoComplete="name"
                        placeholder="Digite seu nome completo"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        required
                        className="h-12 border-slate-200 focus:border-primary focus:ring-primary/20"
                      />
                    </div>

                    {/* WhatsApp */}
                    <div className="space-y-2">
                      <Label
                        htmlFor="whatsapp"
                        className="text-sm font-medium text-slate-700"
                      >
                        WhatsApp
                      </Label>
                      <div className="flex gap-2">
                        <div className="w-24">
                          <CountrySelector
                            selectedCountry={selectedCountry}
                            onCountryChange={handleCountryChange}
                          />
                        </div>
                        <Input
                          id="whatsapp"
                          name="whatsapp"
                          type="tel"
                          autoComplete="tel"
                          placeholder={getPlaceholderText(selectedCountry.code)}
                          value={whatsapp}
                          onChange={handleWhatsappChange}
                          required
                          className="flex-1 h-12 border-slate-200 focus:border-primary focus:ring-primary/20"
                        />
                      </div>
                    </div>
                  </>
                )}

                {/* Email */}
                <div className="space-y-2">
                  <Label
                    htmlFor="email"
                    className="text-sm font-medium text-slate-700"
                  >
                    E-mail
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    placeholder="Digite seu e-mail"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-12 border-slate-200 focus:border-primary focus:ring-primary/20"
                  />
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label
                    htmlFor="password"
                    className="text-sm font-medium text-slate-700"
                  >
                    Senha
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete={
                        isLoginMode ? "current-password" : "new-password"
                      }
                      placeholder="Digite sua senha"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-12 border-slate-200 focus:border-primary focus:ring-primary/20 pr-12"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  className="w-full h-12 bg-primary hover:bg-primary/90 text-white font-medium rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl hover:-translate-y-0.5"
                  disabled={isLoading}
                >
                  {isLoading
                    ? "Carregando..."
                    : isLoginMode
                    ? "Entrar na conta"
                    : "Criar conta"}
                </Button>

                {isLoginMode && (
                  <div className="text-center">
                    <Link
                      to="/forgot-password"
                      className="text-sm text-slate-600 hover:text-primary transition-colors"
                    >
                      Esqueceu sua senha?
                    </Link>
                  </div>
                )}
              </form>
            </CardContent>
          </Card>

          {/* Additional Info */}
          <div className="mt-8 text-center">
            <p className="text-sm text-slate-500">
              {isLoginMode ? "Não tem uma conta?" : "Já tem uma conta?"}{" "}
              <button
                onClick={() => setIsLoginMode(!isLoginMode)}
                className="text-primary hover:text-primary/80 font-medium transition-colors"
              >
                {isLoginMode ? "Criar conta" : "Fazer login"}
              </button>
            </p>
          </div>

          {/* Features */}
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">
                Controle Total
              </h3>
              <p className="text-sm text-slate-600">
                Gerencie suas finanças com precisão
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">
                Metas Inteligentes
              </h3>
              <p className="text-sm text-slate-600">
                Alcance seus objetivos financeiros
              </p>
            </div>

            <div className="text-center">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-primary"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
              </div>
              <h3 className="font-semibold text-slate-900 mb-1">
                Segurança Total
              </h3>
              <p className="text-sm text-slate-600">
                Seus dados estão sempre protegidos
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
