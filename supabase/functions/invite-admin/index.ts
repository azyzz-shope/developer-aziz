import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const allowed = new Set(["profile","projects","messages","requests","blog","reviews","academy","store","maintenance","analytics","clients","bugs"]);
const cors = { "Access-Control-Allow-Origin": "*", "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" };

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: cors });
  if (req.method !== "POST") return new Response("Method not allowed", { status: 405, headers: cors });
  try {
    const url = Deno.env.get("SUPABASE_URL")!;
    const anon = Deno.env.get("SUPABASE_ANON_KEY")!;
    const service = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization") || "";
    const userClient = createClient(url, anon, { global: { headers: { Authorization: authHeader } } });
    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...cors, "Content-Type": "application/json" } });
    const admin = createClient(url, service);
    const { data: owner } = await admin.from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (owner?.role !== "owner") return new Response(JSON.stringify({ error: "Owner access required" }), { status: 403, headers: { ...cors, "Content-Type": "application/json" } });
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");
    const permissions = Array.isArray(body.permissions) ? [...new Set(body.permissions.filter((p: string) => allowed.has(p)))] : [];
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || permissions.length === 0) return new Response(JSON.stringify({ error: "Enter a valid email and at least one permission." }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    const { data, error } = await admin.auth.admin.inviteUserByEmail(email, { redirectTo: url });
    if (error || !data.user) return new Response(JSON.stringify({ error: error?.message || "Invitation failed" }), { status: 400, headers: { ...cors, "Content-Type": "application/json" } });
    const { error: roleError } = await admin.from("user_roles").upsert({ user_id: data.user.id, role: "staff" });
    if (roleError) throw roleError;
    const { error: permError } = await admin.from("admin_permissions").insert(permissions.map((permission: string) => ({ user_id: data.user.id, permission })));
    if (permError) throw permError;
    return new Response(JSON.stringify({ ok: true, invited: email }), { status: 200, headers: { ...cors, "Content-Type": "application/json" } });
  } catch (e) {
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unexpected error" }), { status: 500, headers: { ...cors, "Content-Type": "application/json" } });
  }
});