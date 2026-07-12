import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { getDataSource } from "@/server/data-source";
import { Usuario as UsuarioEntity } from "@/server/entities";
import { hashPassword } from "@/server/auth.server";
import { requirePermission } from "@/server/session.server";
import type { UsuarioAdmin } from "@/types/auth";

function toUsuarioDTO(u: UsuarioEntity): UsuarioAdmin {
  return {
    id: u.id,
    nome: u.nome,
    email: u.email,
    role: u.role,
    ativo: u.ativo,
    criadoEm: u.criadoEm.toISOString(),
  };
}

const roleEnum = z.enum(["admin", "operacional", "financeiro", "recepcao"]);

export const listUsuarios = createServerFn({ method: "GET" }).handler(
  async (): Promise<UsuarioAdmin[]> => {
    await requirePermission("config.gerenciar");
    const ds = await getDataSource();
    const usuarios = await ds.getRepository(UsuarioEntity).find({ order: { nome: "ASC" } });
    return usuarios.map(toUsuarioDTO);
  },
);

export const createUsuario = createServerFn({ method: "POST" })
  .inputValidator(
    z.object({
      nome: z.string().min(2),
      email: z.string().email(),
      role: roleEnum,
      senha: z.string().min(6, "Senha com pelo menos 6 caracteres."),
    }),
  )
  .handler(async ({ data }): Promise<UsuarioAdmin> => {
    await requirePermission("config.gerenciar");
    const ds = await getDataSource();
    const repo = ds.getRepository(UsuarioEntity);

    const email = data.email.toLowerCase();
    const jaExiste = await repo.findOneBy({ email });
    if (jaExiste) throw new Error("Já existe um usuário com este e-mail.");

    const saved = await repo.save(
      repo.create({
        nome: data.nome,
        email,
        role: data.role,
        ativo: true,
        senhaHash: await hashPassword(data.senha),
      }),
    );
    return toUsuarioDTO(saved);
  });

export const updateUsuario = createServerFn({ method: "POST" })
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
  .handler(async ({ data }): Promise<UsuarioAdmin> => {
    const atual = await requirePermission("config.gerenciar");
    const ds = await getDataSource();
    const repo = ds.getRepository(UsuarioEntity);

    const alvo = await repo.findOneBy({ id: data.id });
    if (!alvo) throw new Error("Usuário não encontrado.");

    const { novaSenha, email, ...resto } = data.patch;
    const desativando = resto.ativo === false && alvo.ativo;
    const rebaixando = resto.role !== undefined && resto.role !== "admin" && alvo.role === "admin";

    // Evita lock-out imediato: a sessão relê o usuário do banco a cada request,
    // então se desativar/rebaixar derrubaria o próprio admin na hora.
    if (alvo.id === atual.id && (desativando || rebaixando)) {
      throw new Error("Você não pode desativar ou rebaixar o próprio usuário.");
    }
    if ((desativando || rebaixando) && alvo.role === "admin" && alvo.ativo) {
      const adminsAtivos = await repo.count({ where: { role: "admin", ativo: true } });
      if (adminsAtivos <= 1) {
        throw new Error("Não é possível remover o último administrador ativo.");
      }
    }

    const emailNormalizado = email?.toLowerCase();
    if (emailNormalizado && emailNormalizado !== alvo.email) {
      const duplicado = await repo.findOneBy({ email: emailNormalizado });
      if (duplicado) throw new Error("Já existe um usuário com este e-mail.");
    }

    const mudancas = {
      ...resto,
      ...(emailNormalizado && { email: emailNormalizado }),
      ...(novaSenha && { senhaHash: await hashPassword(novaSenha) }),
    };
    if (Object.keys(mudancas).length > 0) {
      await repo.update(alvo.id, mudancas);
    }
    return toUsuarioDTO(await repo.findOneByOrFail({ id: alvo.id }));
  });
