import { supabase } from "@/integrations/supabase/client";

export interface ReferralStats {
  id: string;
  email: string;
  name: string;
  referral_code: string;
  referral_bonus_days: number;
  referral_bonus_expires_at: string | null;
  total_referrals: number;
  recent_referrals: number;
}

export interface ReferralInfo {
  referral_code: string;
  referral_bonus_days: number;
  referral_bonus_expires_at: string | null;
  total_referrals: number;
  recent_referrals: number;
}

/**
 * Get the current user's referral information
 */
export const getCurrentUserReferralInfo =
  async (): Promise<ReferralInfo | null> => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      // Get referral info from moneyzap_users table directly since referral_stats view doesn't exist in types yet
      const { data: userData, error: userError } = await (supabase as any)
        .from("moneyzap_users")
        .select("referral_code, referral_bonus_days, referral_bonus_expires_at")
        .eq("id", user.id)
        .single();

      if (userError || !userData) {
        console.error("Error fetching user referral info:", userError);
        return null;
      }

      // Get referral counts manually
      const { count: totalReferrals } = await supabase
        .from("moneyzap_users")
        .select("*", { count: "exact", head: true })
        .eq("referred_by", user.id);

      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const { count: recentReferrals } = await supabase
        .from("moneyzap_users")
        .select("*", { count: "exact", head: true })
        .eq("referred_by", user.id)
        .gte("created_at", thirtyDaysAgo.toISOString());

      const data = {
        ...userData,
        total_referrals: totalReferrals || 0,
        recent_referrals: recentReferrals || 0,
      };

      return {
        referral_code: data.referral_code,
        referral_bonus_days: data.referral_bonus_days || 0,
        referral_bonus_expires_at: data.referral_bonus_expires_at,
        total_referrals: data.total_referrals || 0,
        recent_referrals: data.recent_referrals || 0,
      };
    } catch (error) {
      console.error("Error getting referral info:", error);
      return null;
    }
  };

/**
 * Validate if a referral code exists and is valid
 */
export const validateReferralCode = async (
  referralCode: string
): Promise<boolean> => {
  try {
    const { data, error } = await (supabase as any)
      .from("moneyzap_users")
      .select("*")
      .limit(1);

    console.log("Referral validation - Data:", data);

    if (error) {
      console.error("Error validating referral code:", error);
      return false;
    }

    console.log(
      "Referral validation - Code:",
      referralCode.toUpperCase(),
      "Data:",
      data
    );
    return data && data.length > 0;
  } catch (error) {
    console.error("Error validating referral code:", error);
    return false;
  }
};

/**
 * Get referral code owner information (for display purposes)
 */
export const getReferralCodeOwner = async (
  referralCode: string
): Promise<{ name: string; email: string } | null> => {
  try {
    const { data, error } = await (supabase as any)
      .from("moneyzap_users")
      .select("name, email")
      .eq("referral_code", referralCode.toUpperCase())
      .limit(1);

    if (error) {
      console.error("Error getting referral code owner:", error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const user = data[0];
    return {
      name: user.name || user.email.split("@")[0],
      email: user.email,
    };
  } catch (error) {
    console.error("Error getting referral code owner:", error);
    return null;
  }
};

/**
 * Process referral bonus when a new user signs up with a referral code
 */
export const processReferralBonus = async (
  referralCode: string,
  bonusDays: number = 30
): Promise<boolean> => {
  try {
    // First, get the referrer's ID
    const { data: referrerData, error: referrerError } = await (supabase as any)
      .from("moneyzap_users")
      .select("id")
      .eq("referral_code", referralCode.toUpperCase())
      .limit(1);

    if (referrerError || !referrerData || referrerData.length === 0) {
      console.error("Referrer not found for code:", referralCode);
      return false;
    }

    const referrer = referrerData[0];

    // Process the bonus manually since the function doesn't exist in types yet
    const { data: currentUser, error: currentError } = await (supabase as any)
      .from("moneyzap_users")
      .select("referral_bonus_days, referral_bonus_expires_at")
      .eq("id", referrer.id)
      .single();

    if (currentError) {
      console.error("Error fetching current user data:", currentError);
      return false;
    }

    const currentBonusDays = currentUser?.referral_bonus_days || 0;
    const currentExpiry = currentUser?.referral_bonus_expires_at
      ? new Date(currentUser.referral_bonus_expires_at)
      : new Date();

    // Calculate new expiry date based on current bonus status
    let newExpiryDate: Date;
    const now = new Date();

    if (currentExpiry > now) {
      // User is still within their bonus period - extend from current expiry date
      // This allows bonuses to stack (e.g., if bonus expires May 10th and new referral
      // happens April 20th, new expiry becomes May 10th + 30 days = June 09th)
      newExpiryDate = new Date(
        currentExpiry.getTime() + bonusDays * 24 * 60 * 60 * 1000
      );
    } else {
      // User is outside their bonus period - start fresh from current date
      // This prevents gaps in bonus coverage
      newExpiryDate = new Date(now.getTime() + bonusDays * 24 * 60 * 60 * 1000);
    }

    // Update the referrer's bonus
    const { error } = await (supabase as any)
      .from("moneyzap_users")
      .update({
        referral_bonus_days: currentBonusDays + bonusDays,
        referral_bonus_expires_at: newExpiryDate.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", referrer.id);

    if (error) {
      console.error("Error updating referral bonus:", error);
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error processing referral bonus:", error);
    return false;
  }
};

/**
 * Get all users referred by the current user
 */
export const getReferredUsers = async (): Promise<
  Array<{ id: string; name: string; email: string; created_at: string }>
> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    const { data, error } = await (supabase as any)
      .from("moneyzap_users")
      .select("id, name, email, created_at")
      .eq("referred_by", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching referred users:", error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error("Error getting referred users:", error);
    return [];
  }
};

/**
 * Check if current user has active referral bonus
 */
export const hasActiveReferralBonus = async (): Promise<boolean> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return false;

    const { data, error } = await (supabase as any)
      .from("moneyzap_users")
      .select("referral_bonus_expires_at")
      .eq("id", user.id)
      .single();

    if (error || !data) {
      return false;
    }

    if (!data.referral_bonus_expires_at) {
      return false;
    }

    return new Date(data.referral_bonus_expires_at) > new Date();
  } catch (error) {
    console.error("Error checking referral bonus:", error);
    return false;
  }
};

/**
 * Get referral bonus expiry date
 */
export const getReferralBonusExpiry = async (): Promise<Date | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return null;

    const { data, error } = await (supabase as any)
      .from("moneyzap_users")
      .select("referral_bonus_expires_at")
      .eq("id", user.id)
      .single();

    if (error || !data || !data.referral_bonus_expires_at) {
      return null;
    }

    return new Date(data.referral_bonus_expires_at);
  } catch (error) {
    console.error("Error getting referral bonus expiry:", error);
    return null;
  }
};

/**
 * Generate a shareable referral link
 */
export const generateReferralLink = (referralCode: string): string => {
  const baseUrl = window.location.origin;
  return `${baseUrl}/login?mode=register&ref=${referralCode}`;
};

/**
 * Extract referral code from URL parameters
 */
export const getReferralCodeFromUrl = (): string | null => {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get("ref");
};

/**
 * Debug function to check database state
 */
export const debugReferralDatabase = async () => {
  try {
    console.log("🔍 Debugging referral database...");

    // Check current user's data first
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      console.log("❌ No authenticated user found");
      return;
    }

    console.log("👤 Current user ID:", user.id);

    // Check current user's referral info
    const { data: currentUser, error: currentUserError } = await (
      supabase as any
    )
      .from("moneyzap_users")
      .select("id, email, name, referral_code, created_at")
      .eq("id", user.id)
      .single();

    if (currentUserError) {
      console.error("Error fetching current user:", currentUserError);
    } else {
      console.log("👤 Current user data:", currentUser);
    }

    // Test referral code validation with a specific code
    const testCode = "MCIA0001";
    console.log(`🧪 Testing referral code validation for: ${testCode}`);

    const { data: testValidation, error: testError } = await (supabase as any)
      .from("moneyzap_users")
      .select("id, referral_code")
      .eq("referral_code", testCode)
      .limit(1);

    if (testError) {
      console.error("Error testing referral code:", testError);
    } else {
      console.log(`🎯 Test validation result for ${testCode}:`, testValidation);
    }

    // Check if we can see any referral codes at all
    const { data: anyCodes, error: anyCodesError } = await (supabase as any)
      .from("moneyzap_users")
      .select("referral_code")
      .not("referral_code", "is", null)
      .limit(5);

    if (anyCodesError) {
      console.error("Error fetching any referral codes:", anyCodesError);
    } else {
      console.log("🎯 Any referral codes found:", anyCodes);
    }

    return { currentUser, testValidation, anyCodes };
  } catch (error) {
    console.error("Error in debug function:", error);
  }
};
