import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface SetupUser {
  email: string;
  password: string;
  role: "vendedor" | "administrador" | "raiz" | "admin_global";
  full_name: string;
}

const initialUsers: SetupUser[] = [
  {
    email: "contatocredmaisconsultoria@gmail.com",
    password: "Cred3001",
    role: "vendedor",
    full_name: "Vendedor CredMais",
  },
  {
    email: "chelloliver30@gmail.com",
    password: "12345678",
    role: "vendedor",
    full_name: "Chell Oliver",
  },
  {
    email: "jvmodesto10@gmail.com",
    password: "Cred3001",
    role: "raiz",
    full_name: "Super Admin",
  },
  {
    email: "contatonewtcompany@gmail.com",
    password: "Cred3001",
    role: "administrador",
    full_name: "Administrador NewT",
  },
];

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const results: { email: string; success: boolean; message: string }[] = [];

    for (const user of initialUsers) {
      try {
        const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find((u) => u.email === user.email);

        if (existingUser) {
          // Update role to latest
          const { data: existingRole } = await supabaseAdmin
            .from("user_roles")
            .select("*")
            .eq("user_id", existingUser.id)
            .maybeSingle();

          if (!existingRole) {
            await supabaseAdmin.from("user_roles").insert({
              user_id: existingUser.id,
              role: user.role,
            });
          } else if (existingRole.role !== user.role) {
            await supabaseAdmin.from("user_roles")
              .update({ role: user.role })
              .eq("user_id", existingUser.id);
          }

          results.push({ email: user.email, success: true, message: `Role updated to ${user.role}` });
          continue;
        }

        const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
          email: user.email,
          password: user.password,
          email_confirm: true,
          user_metadata: { full_name: user.full_name },
        });

        if (createError) {
          results.push({ email: user.email, success: false, message: createError.message });
          continue;
        }

        if (newUser?.user) {
          await supabaseAdmin.from("user_roles").insert({
            user_id: newUser.user.id,
            role: user.role,
          });
          results.push({ email: user.email, success: true, message: `Created with role: ${user.role}` });
        }
      } catch (err) {
        results.push({ email: user.email, success: false, message: err instanceof Error ? err.message : "Unknown error" });
      }
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({ success: false, error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
