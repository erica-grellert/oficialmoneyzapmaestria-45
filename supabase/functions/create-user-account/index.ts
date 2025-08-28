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

    const { email, password, full_name, phone, country_code } =
      await req.json();

    console.log(`[CREATE-USER-ACCOUNT] Creating user: ${email}`);

    // Check if user already exists
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(
      (user) => user.email === email
    );

    if (userExists) {
      console.log(`[CREATE-USER-ACCOUNT] User ${email} already exists`);
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

    // Note: User profile will be automatically created by the database trigger
    // when a user is inserted into auth.users table
    console.log(
      `[CREATE-USER-ACCOUNT] User profile will be created by database trigger`
    );

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
