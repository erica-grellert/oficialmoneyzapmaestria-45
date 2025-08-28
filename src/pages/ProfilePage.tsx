import React, { useState, useEffect, useRef } from "react";
import { useAdaptiveContext } from "@/hooks/useAdaptiveContext";
import {
  usePreferences,
  Currency,
  Language,
} from "@/contexts/PreferencesContext";
import { useUserRole } from "@/hooks/useUserRole";
import { useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import {
  Phone,
  Camera,
  Mail,
  Key,
  Loader2,
  User,
  Shield,
  Settings,
  ArrowLeft,
  Globe,
  Flag,
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CountrySelector from "@/components/common/CountrySelector";
import {
  countries,
  Country,
  formatPhoneNumber,
  parsePhoneNumber,
} from "@/utils/countryUtils";
import {
  applyPhoneMask,
  getPlaceholderText,
  validatePhoneNumber,
  cleanPhoneNumber,
} from "@/utils/phoneUtils";
import { useNavigate } from "react-router-dom";

const ProfilePage = () => {
  const { t, currency, setCurrency, language, setLanguage } = usePreferences();
  const { user, updateUserProfile } = useAdaptiveContext();
  const { isAdmin } = useUserRole();
  const location = useLocation();
  const navigate = useNavigate();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [phone, setPhone] = useState(() => {
    // Initialize phone with masked value if available in user context
    if (user?.phone) {
      const cleanNumber = cleanPhoneNumber(user.phone);
      // Use Brazil as default for initial masking (will be updated when country is detected)
      return applyPhoneMask(cleanNumber, "BR");
    }
    return "";
  });
  const [selectedCountry, setSelectedCountry] = useState<Country>(() => {
    // Try to detect user's country from browser locale
    const userLocale = navigator.language || navigator.languages?.[0];
    if (userLocale) {
      const countryCode = userLocale.split("-")[1]?.toUpperCase();
      if (countryCode) {
        const detectedCountry = countries.find((c) => c.code === countryCode);
        if (detectedCountry) {
          return detectedCountry;
        }
      }
    }
    return countries[0]; // Default to Brazil
  });
  const [isEditing, setIsEditing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [profileImage, setProfileImage] = useState(user?.profileImage || "");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // For password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [changingPassword, setChangingPassword] = useState(false);

  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Verificar se é admin vindo da página admin
  const isAdminFromAdminPage = isAdmin && document.referrer.includes("/admin");

  // Fetch the latest user data from Supabase
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user?.id) {
          const { data, error } = await supabase
            .from("moneyzap_users")
            .select("*")
            .eq("id", session.user.id)
            .single();

          if (data && !error) {
            setName(data.name || "");
            setEmail(session.user.email || "");
            setProfileImage(data.profile_image || "");

            // Detect country from existing phone number
            if (data.phone) {
              // Clean the phone number first to remove any formatting
              const cleanPhone = cleanPhoneNumber(data.phone);
              const parsed = parsePhoneNumber(cleanPhone);
              if (parsed.country) {
                setSelectedCountry(parsed.country);
                // Apply phone mask for the detected country
                const maskedValue = applyPhoneMask(
                  parsed.localNumber,
                  parsed.country.code
                );
                setPhone(maskedValue);
              } else {
                // If no country detected, apply mask for the default selected country
                const maskedValue = applyPhoneMask(
                  cleanPhone,
                  selectedCountry.code
                );
                setPhone(maskedValue);
              }
            } else if (user?.phone) {
              // If no phone in database but exists in user context, apply mask for default country
              const cleanNumber = cleanPhoneNumber(user.phone);
              const maskedValue = applyPhoneMask(
                cleanNumber,
                selectedCountry.code
              );
              setPhone(maskedValue);
            }
          }
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };

    fetchUserData();
  }, [user?.id]);

  // Apply phone mask when user context changes (e.g., after login)
  useEffect(() => {
    if (user?.phone && !phone) {
      // If user context has phone but local state doesn't, apply mask
      const cleanNumber = cleanPhoneNumber(user.phone);
      const maskedValue = applyPhoneMask(cleanNumber, selectedCountry.code);
      setPhone(maskedValue);
    }
  }, [user?.phone, phone, selectedCountry.code]);

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value.replace(/\D/g, ""); // Remove non-digits

    // If the value already starts with the country code, remove it to avoid duplication
    if (value.startsWith(selectedCountry.dialCode)) {
      value = value.substring(selectedCountry.dialCode.length);
    }

    // Limit to reasonable length for local number (excluding country code)
    if (value.length > 15) {
      value = value.substring(0, 15);
    }

    // Apply phone mask for display
    const maskedValue = applyPhoneMask(value, selectedCountry.code);
    setPhone(maskedValue);
  };

  const handleCountryChange = (country: Country) => {
    setSelectedCountry(country);

    // Update phone field if there's already a value
    if (phone) {
      // Remove old country code if present
      let cleanNumber = cleanPhoneNumber(phone);
      if (cleanNumber.startsWith(selectedCountry.dialCode)) {
        cleanNumber = cleanNumber.substring(selectedCountry.dialCode.length);
      }

      // Apply new country's mask
      const maskedValue = applyPhoneMask(cleanNumber, country.code);
      setPhone(maskedValue);
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setUpdatingProfile(true);

    try {
      // Format phone number with country code before sending
      const formattedPhone = phone
        ? formatPhoneNumber(selectedCountry, phone)
        : "";

      // Check if email changed
      const emailChanged = email !== user?.email;

      await updateUserProfile({
        name,
        phone: formattedPhone,
        profileImage,
      });

      // Update email if changed
      if (emailChanged) {
        const { error: updateEmailError } = await supabase.functions.invoke(
          "update-user-email",
          {
            body: { email },
          }
        );

        if (updateEmailError) {
          console.error("ProfilePage: Error updating email:", updateEmailError);
          toast({
            title: t("common.error"),
            description: "Erro ao atualizar email",
            variant: "destructive",
          });
          return;
        }
      }

      // Show success message
      toast({
        title: t("common.success"),
        description: "Perfil atualizado com sucesso",
      });

      setIsEditing(false);
    } catch (error) {
      toast({
        title: t("common.error"),
        description: "Erro ao atualizar perfil",
        variant: "destructive",
      });
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast({
        title: t("common.error"),
        description: "As senhas não coincidem",
        variant: "destructive",
      });
      return;
    }

    setChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: t("common.success"),
        description: "Senha alterada com sucesso",
      });

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error) {
      console.error("Error updating password:", error);
      toast({
        title: t("common.error"),
        description: "Erro ao alterar senha",
        variant: "destructive",
      });
    } finally {
      setChangingPassword(false);
    }
  };

  const handleImageClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      // Upload image to Supabase Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from("uploads")
        .upload(`${user?.id}/${fileName}`, file);

      if (error) {
        throw error;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from("uploads")
        .getPublicUrl(`${user?.id}/${fileName}`);

      setProfileImage(urlData.publicUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      toast({
        title: t("common.error"),
        description: "Erro ao fazer upload da imagem",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleCurrencyChange = (value: string) => {
    setCurrency(value as Currency);
    toast({
      title: t("common.success"),
      description: "Moeda alterada com sucesso",
    });
  };

  const handleLanguageChange = (value: string) => {
    setLanguage(value as Language);
    toast({
      title: t("common.success"),
      description: "Idioma alterado com sucesso",
    });
  };

  if (isAdminFromAdminPage) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
        {/* Header with back button */}
        <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-600 shadow-sm">
          <div className="max-w-4xl mx-auto px-4 py-4">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate(-1)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                  Perfil do Administrador
                </h1>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-4">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
              Perfil do Administrador
            </h1>
            <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
              Gerencie suas informações de acesso e configurações do sistema
            </p>
          </div>

          <div className="grid gap-8 max-w-3xl mx-auto">
            {/* Profile Information Card */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <User className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-slate-900 dark:text-white">
                      Informações Básicas
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      Seus dados de acesso e identificação
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center gap-6 p-6 bg-gradient-to-r from-slate-50 to-blue-50 dark:from-slate-700/50 dark:to-blue-900/20 rounded-xl">
                  <Avatar className="h-20 w-20 ring-4 ring-white dark:ring-slate-700 shadow-lg">
                    {uploading ? (
                      <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full">
                        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      <>
                        <AvatarImage src={profileImage} />
                        <AvatarFallback className="text-2xl font-semibold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                          {name?.charAt(0) || email?.charAt(0)}
                        </AvatarFallback>
                      </>
                    )}
                  </Avatar>
                  <div className="space-y-2">
                    <h3 className="text-xl font-semibold text-slate-900 dark:text-white">
                      {user?.name || "Administrador"}
                    </h3>
                    <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      {user?.email}
                    </p>
                  </div>
                </div>

                {isEditing ? (
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <label
                          htmlFor="name"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Nome Completo
                        </label>
                        <Input
                          id="name"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          placeholder="Seu nome completo"
                          className="h-12 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                        />
                      </div>

                      <div className="space-y-2">
                        <label
                          htmlFor="email"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          E-mail
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                          <Input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            className="h-12 pl-12 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <Button
                        type="submit"
                        disabled={updatingProfile}
                        className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                      >
                        {updatingProfile && (
                          <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        )}
                        {t("common.save")}
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsEditing(false)}
                        className="flex-1 h-12 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
                      >
                        {t("common.cancel")}
                      </Button>
                    </div>
                  </form>
                ) : (
                  <Button
                    onClick={() => setIsEditing(true)}
                    className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    Editar Informações
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Password Change Card */}
            <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
              <CardHeader className="pb-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                    <Key className="w-5 h-5 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <CardTitle className="text-2xl text-slate-900 dark:text-white">
                      Alterar Senha
                    </CardTitle>
                    <CardDescription className="text-slate-600 dark:text-slate-400">
                      Atualize sua senha de acesso com segurança
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <form onSubmit={handlePasswordChange} className="space-y-6">
                  <div className="grid gap-4">
                    <div className="space-y-2">
                      <label
                        htmlFor="newPassword"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Nova Senha
                      </label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                        <Input
                          id="newPassword"
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          placeholder="••••••••"
                          className="h-12 pl-12 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label
                        htmlFor="confirmPassword"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                      >
                        Confirmar Senha
                      </label>
                      <div className="relative">
                        <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          placeholder="••••••••"
                          className="h-12 pl-12 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                          required
                        />
                      </div>
                    </div>
                  </div>

                  <Button
                    type="submit"
                    disabled={changingPassword}
                    className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                  >
                    {changingPassword && (
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    )}
                    Alterar Senha
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
      {/* Header with back button */}
      <div className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-600 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-xl font-semibold text-slate-900 dark:text-white">
                {t("profile.title")}
              </h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full mb-6 shadow-xl">
            <User className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-300 bg-clip-text text-transparent">
            {t("profile.title")}
          </h1>
          <p className="text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto">
            Gerencie seus dados pessoais, configurações de conta e preferências
          </p>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto">
          <Tabs defaultValue="info" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3 h-14 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-600 shadow-lg">
              <TabsTrigger
                value="info"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-blue-500 data-[state=active]:to-purple-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 h-12 rounded-lg"
              >
                <User className="w-4 h-4 mr-2" />
                Informações Pessoais
              </TabsTrigger>
              <TabsTrigger
                value="password"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-green-500 data-[state=active]:to-emerald-600 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 h-12 rounded-lg"
              >
                <Key className="w-4 h-4 mr-2" />
                Senha
              </TabsTrigger>
              <TabsTrigger
                value="preferences"
                className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-500 data-[state=active]:to-red-500 data-[state=active]:text-white data-[state=active]:shadow-lg transition-all duration-300 h-12 rounded-lg"
              >
                <Settings className="w-4 h-4 mr-2" />
                Preferências
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-6">
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
                      <User className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-slate-900 dark:text-white">
                        Informações Pessoais
                      </CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400">
                        Seus dados de cadastro e informações de contato
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Profile Image Section */}
                  <div className="flex items-center gap-8 p-8 from-slate-50 to-blue-50 dark:from-slate-700/50 dark:to-blue-900/20 rounded-2xl">
                    <div className="relative">
                      <Avatar className="h-24 w-24 ring-4 ring-white dark:ring-slate-700 shadow-xl">
                        {uploading ? (
                          <div className="flex h-full w-full items-center justify-center bg-slate-100 dark:bg-slate-700 rounded-full">
                            <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
                          </div>
                        ) : (
                          <>
                            <AvatarImage src={profileImage} />
                            <AvatarFallback className="text-3xl font-bold bg-gradient-to-br from-blue-500 to-purple-600 text-white">
                              {name?.charAt(0) || email?.charAt(0)}
                            </AvatarFallback>
                          </>
                        )}
                      </Avatar>
                      {isEditing && (
                        <div
                          className="absolute -bottom-2 -right-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-full p-3 cursor-pointer shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-110"
                          onClick={handleImageClick}
                        >
                          <Camera className="h-5 w-5" />
                          <input
                            type="file"
                            ref={fileInputRef}
                            className="hidden"
                            accept="image/*"
                            onChange={handleImageChange}
                          />
                        </div>
                      )}
                    </div>
                    <div className="space-y-3">
                      <h3 className="text-2xl font-semibold text-slate-900 dark:text-white">
                        {name || "Usuário"}
                      </h3>
                      <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        {user?.email}
                      </p>
                      {user?.user_metadata.phone && (
                        <p className="text-slate-600 dark:text-slate-400 flex items-center gap-2">
                          <Phone className="w-4 h-4" />
                          {user?.user_metadata?.phone}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Edit Form */}
                  {isEditing ? (
                    <form onSubmit={handleSubmit} className="space-y-6">
                      <div className="grid gap-6">
                        <div className="space-y-3">
                          <label
                            htmlFor="name"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                          >
                            Nome Completo
                          </label>
                          <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Seu nome completo"
                            className="h-12 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          />
                        </div>

                        <div className="space-y-3">
                          <label
                            htmlFor="phone"
                            className="text-sm font-medium text-slate-700 dark:text-slate-300"
                          >
                            WhatsApp
                          </label>
                          <div className="flex gap-3">
                            <div className="w-36 flex-shrink-0">
                              <CountrySelector
                                selectedCountry={selectedCountry}
                                onCountryChange={handleCountryChange}
                                disabled={updatingProfile}
                              />
                            </div>
                            <div className="relative flex-1">
                              <Phone className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                              <Input
                                id="phone"
                                value={phone}
                                onChange={handlePhoneChange}
                                placeholder={getPlaceholderText(
                                  selectedCountry.code
                                )}
                                className="h-12 pl-12 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                                type="tel"
                                maxLength={20}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex gap-3 pt-6">
                        <Button
                          type="submit"
                          disabled={updatingProfile}
                          className="flex-1 h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                        >
                          {updatingProfile && (
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                          )}
                          {t("common.save")}
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setIsEditing(false)}
                          className="flex-1 h-12 border-slate-200 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-all duration-200"
                        >
                          {t("common.cancel")}
                        </Button>
                      </div>
                    </form>
                  ) : (
                    <Button
                      onClick={() => setIsEditing(true)}
                      className="w-full h-12 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      Editar Perfil
                    </Button>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="password" className="space-y-6">
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-xl">
                      <Key className="w-6 h-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-slate-900 dark:text-white">
                        Alterar Senha
                      </CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400">
                        Atualize sua senha de acesso com segurança
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-6">
                    <div className="grid gap-6">
                      <div className="space-y-3">
                        <label
                          htmlFor="newPassword"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Nova Senha
                        </label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                          <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-12 pl-12 border-slate-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label
                          htmlFor="confirmPassword"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Confirmar Senha
                        </label>
                        <div className="relative">
                          <Key className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 h-5 w-5" />
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            className="h-12 pl-12 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <Button
                      type="submit"
                      disabled={changingPassword}
                      className="w-full h-12 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-medium transition-all duration-200 shadow-lg hover:shadow-xl"
                    >
                      {changingPassword && (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      )}
                      Alterar Senha
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="preferences" className="space-y-6">
              <Card className="border-0 shadow-xl bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm">
                <CardHeader className="pb-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-xl">
                      <Settings className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl text-slate-900 dark:text-white">
                        Preferências
                      </CardTitle>
                      <CardDescription className="text-slate-600 dark:text-slate-400">
                        Configure seu idioma e moeda preferidos
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Language and Currency Settings */}
                  <div className="grid gap-8 md:grid-cols-2">
                    {/* Language Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                          <Globe className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          Idioma
                        </h3>
                      </div>
                      <div className="space-y-3">
                        <label
                          htmlFor="language-select"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Selecione seu idioma
                        </label>
                        <Select
                          value={language}
                          onValueChange={handleLanguageChange}
                        >
                          <SelectTrigger
                            id="language-select"
                            className="h-12 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                          >
                            <Globe className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Selecione o idioma" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="pt">Português</SelectItem>
                              <SelectItem value="en">English</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          O idioma será aplicado em toda a aplicação
                        </p>
                      </div>
                    </div>

                    {/* Currency Selection */}
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
                          <Flag className="w-5 h-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
                          Moeda
                        </h3>
                      </div>
                      <div className="space-y-3">
                        <label
                          htmlFor="currency-select"
                          className="text-sm font-medium text-slate-700 dark:text-slate-300"
                        >
                          Selecione sua moeda
                        </label>
                        <Select
                          value={currency}
                          onValueChange={handleCurrencyChange}
                        >
                          <SelectTrigger
                            id="currency-select"
                            className="h-12 border-slate-200 dark:border-slate-600 focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all duration-200"
                          >
                            <Flag className="mr-2 h-4 w-4" />
                            <SelectValue placeholder="Selecione a moeda" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectItem value="BRL">BRL (R$)</SelectItem>
                              <SelectItem value="USD">USD ($)</SelectItem>
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <p className="text-sm text-slate-500 dark:text-slate-400">
                          A moeda será usada para exibir valores monetários
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Additional Info */}
                  <div className="p-6 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-orange-100 bg-orange-900/30 rounded-lg mt-1">
                        <Settings className="w-5 h-5 text-white" />
                      </div>
                      <div className="space-y-2">
                        <h4 className="font-medium text-white ">IMPORTANTE!</h4>
                        <p className="text-sm text-white">
                          Suas preferências de idioma e moeda são salvas
                          automaticamente e aplicadas em toda a aplicação. As
                          alterações são refletidas imediatamente.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
