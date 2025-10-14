import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const { email, password, full_name, phone, country_code, referral_code } =
      await req.json();

    console.log(`[CREATE-USER-ACCOUNT] Creating user: ${email}`);

    // Check if user already exists in both auth and moneyzap_users tables
    const { data: existingAuthUser } =
      await supabaseAdmin.auth.admin.listUsers();
    const authUserExists = existingAuthUser?.users?.some(
      (user) => user.email === email
    );

    const { data: existingProfileUser } = await supabaseAdmin
      .from("moneyzap_users")
      .select("id, email")
      .eq("email", email)
      .limit(1);

    if (
      authUserExists ||
      (existingProfileUser && existingProfileUser.length > 0)
    ) {
      console.log(
        `[CREATE-USER-ACCOUNT] User ${email} already exists in auth: ${authUserExists}, in profile: ${
          existingProfileUser?.length > 0
        }`
      );
      return new Response(
        JSON.stringify({
          error: "User already exists",
          message: "Este e-mail já está cadastrado. Faça login.",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 400,
        }
      );
    }

    // Create user with auto-confirmed email
    console.log(
      `[CREATE-USER-ACCOUNT] Creating auth user with auto-confirmed email`
    );
    const { data: newUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true, // This auto-confirms the email
        user_metadata: {
          full_name,
          phone, // Changed from whatsapp to phone to match database schema
          country_code,
        },
      });

    if (createUserError) {
      console.error(
        `[CREATE-USER-ACCOUNT] Error creating user:`,
        createUserError
      );
      throw createUserError;
    }

    const userId = newUser.user.id;
    console.log(`[CREATE-USER-ACCOUNT] User created with ID: ${userId}`);

    // Handle referral code if provided
    let referrerId = null;
    if (referral_code) {
      console.log(
        `[CREATE-USER-ACCOUNT] Processing referral code: ${referral_code}`
      );

      // Get the referrer's ID
      const { data: referrer, error: referrerError } = await supabaseAdmin
        .from("moneyzap_users")
        .select("id")
        .eq("referral_code", referral_code.toUpperCase())
        .single();

      if (referrerError || !referrer) {
        console.log(
          `[CREATE-USER-ACCOUNT] Invalid referral code: ${referral_code}`
        );
      } else {
        referrerId = referrer.id;
        console.log(
          `[CREATE-USER-ACCOUNT] Valid referral code, referrer ID: ${referrerId}`
        );
      }
    }

    // Create user profile with referral information
    console.log(
      `[CREATE-USER-ACCOUNT] Creating user profile with referral info`
    );
    console.log(
      `[CREATE-USER-ACCOUNT] Profile data - userId: ${userId}, referred_by: ${referrerId}, referral_code: ${referral_code}`
    );
    const { error: profileError } = await supabaseAdmin
      .from("moneyzap_users")
      .insert({
        id: userId,
        email,
        name: full_name || email.split("@")[0],
        phone,
        referred_by: referrerId,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error(
        `[CREATE-USER-ACCOUNT] Error creating user profile:`,
        profileError
      );

      // Handle duplicate key constraint specifically
      if (
        profileError.code === "23505" ||
        profileError.message?.includes("duplicate key")
      ) {
        console.log(
          `[CREATE-USER-ACCOUNT] User profile already exists, checking if user was created successfully`
        );

        // Check if the user profile actually exists (race condition - first request succeeded)
        const { data: existingProfile, error: checkError } = await supabaseAdmin
          .from("moneyzap_users")
          .select("id, email, name, referred_by")
          .eq("id", userId)
          .single();

        if (existingProfile && !checkError) {
          console.log(
            `[CREATE-USER-ACCOUNT] User profile exists, updating referred_by field and processing bonus`
          );
          console.log(
            `[CREATE-USER-ACCOUNT] Existing profile - referred_by: ${existingProfile.referred_by}, expected: ${referrerId}`
          );

          // Update the existing user with referred_by field if it's not set
          if (referrerId && !existingProfile.referred_by) {
            console.log(
              `[CREATE-USER-ACCOUNT] Updating existing user with referred_by: ${referrerId}`
            );
            const { error: updateError } = await supabaseAdmin
              .from("moneyzap_users")
              .update({
                referred_by: referrerId,
                updated_at: new Date().toISOString(),
              })
              .eq("id", userId);

            if (updateError) {
              console.error(
                `[CREATE-USER-ACCOUNT] Error updating referred_by field:`,
                updateError
              );
            } else {
              console.log(
                `[CREATE-USER-ACCOUNT] Successfully updated referred_by field`
              );
            }
          }

          // Process referral bonus for the referrer
          if (referrerId) {
            console.log(
              `[CREATE-USER-ACCOUNT] Processing referral bonus for referrer: ${referrerId} (race condition case)`
            );

            try {
              // Get current referral bonus data
              const { data: referrerData, error: fetchError } =
                await supabaseAdmin
                  .from("moneyzap_users")
                  .select("referral_bonus_days, referral_bonus_expires_at")
                  .eq("id", referrerId)
                  .single();

              if (fetchError) {
                console.error(
                  `[CREATE-USER-ACCOUNT] Error fetching referrer data (race condition):`,
                  fetchError
                );
              } else {
                const currentBonusDays = referrerData?.referral_bonus_days || 0;
                const currentExpiryDate =
                  referrerData?.referral_bonus_expires_at;
                const now = new Date();

                let newExpiryDate: Date;

                // Check if referral_bonus_expires_at is in the future
                if (currentExpiryDate && new Date(currentExpiryDate) > now) {
                  // If it is, add 30 days to it
                  newExpiryDate = new Date(currentExpiryDate);
                  newExpiryDate.setDate(newExpiryDate.getDate() + 30);
                } else {
                  // If it is not, set it to the current date + 30 days
                  newExpiryDate = new Date(now);
                  newExpiryDate.setDate(newExpiryDate.getDate() + 30);
                }

                // Update the referral_bonus_days and referral_bonus_expires_at
                const { error: updateError } = await supabaseAdmin
                  .from("moneyzap_users")
                  .update({
                    referral_bonus_days: currentBonusDays + 30,
                    referral_bonus_expires_at: newExpiryDate.toISOString(),
                    updated_at: new Date().toISOString(),
                  })
                  .eq("id", referrerId);

                if (updateError) {
                  console.error(
                    `[CREATE-USER-ACCOUNT] Error updating referral bonus (race condition):`,
                    updateError
                  );
                } else {
                  console.log(
                    `[CREATE-USER-ACCOUNT] Successfully updated referral bonus for referrer: ${referrerId} (race condition). New bonus days: ${
                      currentBonusDays + 30
                    }, expires at: ${newExpiryDate.toISOString()}`
                  );
                }
              }
            } catch (error) {
              console.error(
                `[CREATE-USER-ACCOUNT] Exception processing referral bonus (race condition):`,
                error
              );
            }
          }

          return new Response(
            JSON.stringify({
              message: "User created successfully (race condition resolved)",
              user: newUser.user,
              success: true,
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 200,
            }
          );
        } else {
          console.log(
            `[CREATE-USER-ACCOUNT] User profile doesn't exist, this is a real error`
          );
          return new Response(
            JSON.stringify({
              error: "User already exists",
              message: "Este e-mail já está cadastrado. Faça login.",
            }),
            {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
              status: 400,
            }
          );
        }
      }

      throw profileError;
    }

    // Process referral bonus if valid referral code was used
    if (referrerId) {
      console.log(
        `[CREATE-USER-ACCOUNT] Processing referral bonus for referrer: ${referrerId}`
      );

      try {
        // Get current referral bonus data
        const { data: referrerData, error: fetchError } = await supabaseAdmin
          .from("moneyzap_users")
          .select("referral_bonus_days, referral_bonus_expires_at")
          .eq("id", referrerId)
          .single();

        if (fetchError) {
          console.error(
            `[CREATE-USER-ACCOUNT] Error fetching referrer data:`,
            fetchError
          );
        } else {
          const currentBonusDays = referrerData?.referral_bonus_days || 0;
          const currentExpiryDate = referrerData?.referral_bonus_expires_at;
          const now = new Date();

          let newExpiryDate: Date;

          // Check if referral_bonus_expires_at is in the future
          if (currentExpiryDate && new Date(currentExpiryDate) > now) {
            // If it is, add 30 days to it
            newExpiryDate = new Date(currentExpiryDate);
            newExpiryDate.setDate(newExpiryDate.getDate() + 30);
          } else {
            // If it is not, set it to the current date + 30 days
            newExpiryDate = new Date(now);
            newExpiryDate.setDate(newExpiryDate.getDate() + 30);
          }

          // Update the referral_bonus_days and referral_bonus_expires_at
          const { error: updateError } = await supabaseAdmin
            .from("moneyzap_users")
            .update({
              referral_bonus_days: currentBonusDays + 30,
              referral_bonus_expires_at: newExpiryDate.toISOString(),
              updated_at: new Date().toISOString(),
            })
            .eq("id", referrerId);

          if (updateError) {
            console.error(
              `[CREATE-USER-ACCOUNT] Error updating referral bonus:`,
              updateError
            );
          } else {
            console.log(
              `[CREATE-USER-ACCOUNT] Successfully updated referral bonus for referrer: ${referrerId}. New bonus days: ${
                currentBonusDays + 30
              }, expires at: ${newExpiryDate.toISOString()}`
            );
          }
        }
      } catch (error) {
        console.error(
          `[CREATE-USER-ACCOUNT] Exception processing referral bonus:`,
          error
        );
      }
    }

    return new Response(
      JSON.stringify({
        message: "User created successfully with auto-confirmed email",
        user: newUser.user,
        success: true,
        // Note: No session is returned as admin.createUser doesn't create sessions
        // The client should sign in with the credentials to get a session
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error(`[CREATE-USER-ACCOUNT] Critical error:`, error);
    return new Response(
      JSON.stringify({
        error: error.message,
        success: false,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
