import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { UsuarioAdmin, Role } from "@/types/auth";

const roleEnum = z.enum(["admin", "operacional", "financeiro", "recepcao"]);

/**
 * Lista usuários combinando `profiles` + `user_roles`.
 * Cada usuário mostra o primeiro papel encontrado (o schema permite N, mas o
 * app usa 1 por usuário).
 */
export const listUsuarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UsuarioAdmin[]> => {
    const [{ data: profiles, error: pErr }, { data: roles, error: rErr }] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("id, nome, email, ativo, criado_em")
        .order("nome"),
      context.supabase.from("user_roles").select("user_id, role"),
    ]);
    if (pErr) throw new Error(pErr.message);
    if (rErr) throw new Error(rErr.message);
    const roleByUser = new Map<string, Role>();
    (roles ?? []).forEach((r) => {
      if (!roleByUser.has(r.user_id)) roleByUser.set(r.user_id, r.role as Role);
    });
    return (profiles ?? []).map((p) => ({
      id: p.id,
      nome: p.nome,
      email: p.email,
      role: (roleByUser.get(p.id) ?? "recepcao") as Role,
      ativo: p.ativo,
      criadoEm: p.criado_em,
    }));
  });

/**
 * Criação de novo usuário requer service role (auth admin) e está temporariamente
 * indisponível pela UI — enquanto isso o admin pode criar contas pela área de
 * admin do Lovable Cloud.
 */
export const createUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      nome: z.string().min(2),
      email: z.string().email(),
      role: roleEnum,
      senha: z.string().min(6),
    }),
  )
  .handler(async (): Promise<UsuarioAdmin> => {
    throw new Error(
      "Cadastro de novo usuário indisponível temporariamente. Peça ao administrador.",
    );
  });

/**
 * Atualiza nome/ativo em `profiles` e substitui o papel em `user_roles`.
 * Não altera e-mail nem senha (isso passa pelo Supabase Auth).
 */
export const updateUsuario = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    z.object({
      id: z.string().uuid(),
      patch: z.object({
        nome: z.string().min(2).optional(),
        email: z.string().email().optional(),
        role: roleEnum.optional(),
        ativo: z.boolean().optional(),
        novaSenha: z.string().min(6).optional(),
      }),
    }),
  )
  .handler(async ({ data, context }): Promise<UsuarioAdmin> => {
    const { nome, ativo, role } = data.patch;

    // Não permite se desativar / se rebaixar
    if (context.userId === data.id) {
      if (ativo === false) throw new Error("Você não pode desativar o próprio usuário.");
      if (role && role !== "admin") throw new Error("Você não pode rebaixar o próprio usuário.");
    }

    // Garante que não estamos removendo o último admin
    if (role && role !== "admin") {
      const { data: adminRoles } = await context.supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");
      const admins = (adminRoles ?? []).map((r) => r.user_id);
      if (admins.length <= 1 && admins.includes(data.id)) {
        throw new Error("Não é possível remover o último administrador ativo.");
      }
    }

    if (nome !== undefined || ativo !== undefined) {
      const profilePatch: Record<string, unknown> = {};
      if (nome !== undefined) profilePatch.nome = nome;
      if (ativo !== undefined) profilePatch.ativo = ativo;
      const { error } = await context.supabase
        .from("profiles")
        .update(profilePatch as never)
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }

    if (role !== undefined) {
      // Apaga papéis atuais e insere o novo — modelo de "papel único" da UI.
      const { error: delErr } = await context.supabase
        .from("user_roles")
        .delete()
        .eq("user_id", data.id);
      if (delErr) throw new Error(delErr.message);
      const { error: insErr } = await context.supabase
        .from("user_roles")
        .insert({ user_id: data.id, role });
      if (insErr) throw new Error(insErr.message);
    }

    const [{ data: profile }, { data: roles }] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("id, nome, email, ativo, criado_em")
        .eq("id", data.id)
        .single(),
      context.supabase.from("user_roles").select("role").eq("user_id", data.id),
    ]);
    if (!profile) throw new Error("Usuário não encontrado.");
    return {
      id: profile.id,
      nome: profile.nome,
      email: profile.email,
      role: ((roles?.[0]?.role as Role) ?? "recepcao") as Role,
      ativo: profile.ativo,
      criadoEm: profile.criado_em,
    };
  });
