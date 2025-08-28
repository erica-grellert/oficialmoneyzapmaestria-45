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

    const {
      email,
      password,
      name,
      role = "admin",
      withSubscription = true,
    } = await req.json();

    console.log(`[CREATE-COMPLETE-USER] Creating user: ${email}`);

    // Verificar se o usuário já existe
    const { data: existingUser } = await supabaseAdmin.auth.admin.listUsers();
    const userExists = existingUser?.users?.some(
      (user) => user.email === email
    );

    if (userExists) {
      console.log(`[CREATE-COMPLETE-USER] User ${email} already exists`);
      return new Response(JSON.stringify({ message: "User already exists" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // 1. Criar usuário no auth.users
    console.log(`[CREATE-COMPLETE-USER] Creating auth user`);
    const { data: newUser, error: createUserError } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          name: name || email.split("@")[0],
        },
      });

    if (createUserError) {
      console.error(
        `[CREATE-COMPLETE-USER] Error creating user:`,
        createUserError
      );
      throw createUserError;
    }

    const userId = newUser.user.id;
    console.log(`[CREATE-COMPLETE-USER] User created with ID: ${userId}`);

    // 2. Inserir perfil em moneyzap_users
    console.log(`[CREATE-COMPLETE-USER] Creating user profile`);
    const { error: profileError } = await supabaseAdmin
      .from("moneyzap_users")
      .insert({
        id: userId,
        email,
        name: name || email.split("@")[0],
        stripe_customer_id: withSubscription
          ? `cus_sim_${userId.slice(0, 8)}`
          : null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error(
        `[CREATE-COMPLETE-USER] Error creating profile:`,
        profileError
      );
      throw profileError;
    }

    // 3. Atribuir role
    console.log(`[CREATE-COMPLETE-USER] Assigning role: ${role}`);
    const { error: roleError } = await supabaseAdmin.from("user_roles").insert({
      user_id: userId,
      role: role,
    });

    if (roleError) {
      console.error(`[CREATE-COMPLETE-USER] Error assigning role:`, roleError);
      throw roleError;
    }

    // 4. Criar subscription ativa (se solicitado)
    if (withSubscription) {
      console.log(`[CREATE-COMPLETE-USER] Creating active subscription`);
      const currentDate = new Date();
      const endDate = new Date();
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 ano de plano

      const { error: subscriptionError } = await supabaseAdmin
        .from("moneyzap_subscriptions")
        .insert({
          user_id: userId,
          stripe_customer_id: `cus_sim_${userId.slice(0, 8)}`, // ID simulado
          stripe_subscription_id: `sub_sim_${userId.slice(0, 8)}`, // ID simulado
          status: "active",
          plan_type: "annual",
          current_period_start: currentDate.toISOString(),
          current_period_end: endDate.toISOString(),
          cancel_at_period_end: false,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        });

      if (subscriptionError) {
        console.error(
          `[CREATE-COMPLETE-USER] Error creating subscription:`,
          subscriptionError
        );
        throw subscriptionError;
      }
    }

    // 5. Criar categorias padrão
    console.log(`[CREATE-COMPLETE-USER] Creating default categories`);

    // Categorias de Receita
    const incomeCategories = [
      { name: "Salário", color: "#10B981", icon: "briefcase", type: "income" },
      { name: "Freelance", color: "#8B5CF6", icon: "code", type: "income" },
      {
        name: "Investimentos",
        color: "#F59E0B",
        icon: "trending-up",
        type: "income",
      },
      { name: "Outros", color: "#6B7280", icon: "plus-circle", type: "income" },
    ];

    // Categorias de Despesa
    const expenseCategories = [
      {
        name: "Alimentação",
        color: "#EF4444",
        icon: "utensils",
        type: "expense",
      },
      { name: "Transporte", color: "#3B82F6", icon: "car", type: "expense" },
      { name: "Moradia", color: "#8B5CF6", icon: "home", type: "expense" },
      { name: "Saúde", color: "#10B981", icon: "heart", type: "expense" },
      {
        name: "Educação",
        color: "#F59E0B",
        icon: "book-open",
        type: "expense",
      },
      { name: "Lazer", color: "#EC4899", icon: "smile", type: "expense" },
      {
        name: "Compras",
        color: "#F97316",
        icon: "shopping-bag",
        type: "expense",
      },
      { name: "Contas", color: "#6B7280", icon: "file-text", type: "expense" },
      {
        name: "Outros",
        color: "#6B7280",
        icon: "more-horizontal",
        type: "expense",
      },
    ];

    const allCategories = [...incomeCategories, ...expenseCategories].map(
      (cat) => ({
        ...cat,
        user_id: userId,
        is_default: true,
        created_at: new Date().toISOString(),
      })
    );

    const { error: categoriesError } = await supabaseAdmin
      .from("moneyzap_categories")
      .insert(allCategories);

    if (categoriesError) {
      console.error(
        `[CREATE-COMPLETE-USER] Error creating categories:`,
        categoriesError
      );
      // Não fazer throw aqui pois as categorias são opcionais
    }

    console.log(
      `[CREATE-COMPLETE-USER] ✅ User ${email} created successfully with all components`
    );

    return new Response(
      JSON.stringify({
        message: "User created successfully",
        user_id: userId,
        email,
        role,
        subscription_active: withSubscription,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      }
    );
  } catch (error) {
    console.error(`[CREATE-COMPLETE-USER] Critical error:`, error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
