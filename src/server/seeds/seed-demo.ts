/**
 * Seed de DADOS DE EXEMPLO (tutores, pets, OS, contratos, pagamentos) — os
 * mesmos que viviam nos mocks do frontend. Uso: `bun run seed:demo`.
 *
 * NÃO roda no entrypoint do container: é opcional e pensado para dev/demo.
 * Idempotente de forma grosseira: se o primeiro tutor demo já existe (por CPF),
 * assume que o seed já foi aplicado e não faz nada.
 */
import bcrypt from "bcryptjs";
import { getDataSource } from "../data-source";
import {
  Tutor,
  Pet,
  Especie,
  Raca,
  ModalidadeServico,
  ServicoProduto,
  Usuario,
  OrdemServico,
  OSItem,
  HistoricoStatusOS,
  Contrato,
  ContratoPet,
  ContratoServico,
  OrdemPagamento,
  Parcela,
} from "../entities";
import { tutoresMock } from "@/mocks/tutores";
import { petsMock } from "@/mocks/pets";
import { ordensServicoMock } from "@/mocks/ordens_servico";
import { contratosMock } from "@/mocks/contratos";
import { pagamentosMock } from "@/mocks/pagamentos";
import { especiesMock, racasMock, modalidadesMock, servicosProdutosMock } from "@/mocks/lookups";

const ds = await getDataSource();

// --- Usuários demo extras (além dos 4 do seed base) — o histórico das OS demo
// referencia "Bruno Carvalho". Idempotente por email, roda mesmo se o resto do
// demo já foi aplicado. Senha "123456" como os demais.
const usuariosDemo: Array<Pick<Usuario, "nome" | "email" | "role" | "ativo">> = [
  { nome: "Bruno Carvalho", email: "bruno.carvalho@qamigo.com", role: "operacional", ativo: true },
  { nome: "Camila Duarte", email: "camila.duarte@qamigo.com", role: "recepcao", ativo: false },
];
const usuarioRepo = ds.getRepository(Usuario);
const senhaHashDemo = await bcrypt.hash("123456", 10);
for (const u of usuariosDemo) {
  const existente = await usuarioRepo.findOne({ where: { email: u.email } });
  if (existente) continue;
  await usuarioRepo.save(usuarioRepo.create({ ...u, senhaHash: senhaHashDemo }));
}
console.log(`Usuários demo: ${usuariosDemo.length}`);

const jaExiste = await ds.getRepository(Tutor).findOne({ where: { cpf: tutoresMock[0].cpf } });
if (jaExiste) {
  console.log("Seed demo já aplicado (tutor demo encontrado) — nada a fazer.");
  await ds.destroy();
  process.exit(0);
}

await ds.transaction(async (m) => {
  // --- Mapas mockId → uuid do banco para os lookups (semeados pelo seed base, por nome) ---
  const especies = await m.getRepository(Especie).find();
  const racas = await m.getRepository(Raca).find();
  const modalidades = await m.getRepository(ModalidadeServico).find();
  const servicos = await m.getRepository(ServicoProduto).find();
  const usuarios = await m.getRepository(Usuario).find();
  if (!especies.length || !modalidades.length || !servicos.length || !usuarios.length) {
    throw new Error("Rode `bun run seed` (usuários + lookups) antes do seed demo.");
  }

  const especieId = new Map(
    especiesMock.map((e) => {
      const row = especies.find((x) => x.nome === e.nome);
      if (!row) throw new Error(`Espécie "${e.nome}" não encontrada no banco.`);
      return [e.id, row.id];
    }),
  );
  const racaId = new Map(
    racasMock.map((r) => {
      const espMock = especiesMock.find((e) => e.id === r.especieId)!;
      const row = racas.find((x) => x.nome === r.nome && x.especieId === especieId.get(espMock.id));
      if (!row) throw new Error(`Raça "${r.nome}" (${espMock.nome}) não encontrada no banco.`);
      return [r.id, row.id];
    }),
  );
  const modalidadeId = new Map(
    modalidadesMock.map((mo) => {
      const row = modalidades.find((x) => x.nome === mo.nome);
      if (!row) throw new Error(`Modalidade "${mo.nome}" não encontrada no banco.`);
      return [mo.id, row.id];
    }),
  );
  const servicoId = new Map(
    servicosProdutosMock.map((s) => {
      const row = servicos.find((x) => x.nome === s.nome);
      if (!row) throw new Error(`Serviço/produto "${s.nome}" não encontrado no banco.`);
      return [s.id, row.id];
    }),
  );
  const admin = usuarios.find((u) => u.role === "admin") ?? usuarios[0];
  const usuarioPorNome = (nome: string) => usuarios.find((u) => u.nome === nome) ?? admin;

  // --- Tutores ---
  const tutorId = new Map<string, string>();
  for (const t of tutoresMock) {
    const saved = await m.getRepository(Tutor).save(
      m.getRepository(Tutor).create({
        nome: t.nome,
        cpf: t.cpf,
        email: t.email,
        telefone: t.telefone,
        cep: t.endereco.cep,
        logradouro: t.endereco.logradouro,
        numero: t.endereco.numero,
        complemento: t.endereco.complemento ?? null,
        bairro: t.endereco.bairro,
        cidade: t.endereco.cidade,
        uf: t.endereco.uf,
        observacoes: t.observacoes ?? null,
        criadoEm: new Date(t.criadoEm),
      }),
    );
    tutorId.set(t.id, saved.id);
  }
  console.log(`Tutores demo: ${tutoresMock.length}`);

  // --- Pets ---
  const petId = new Map<string, string>();
  for (const p of petsMock) {
    const saved = await m.getRepository(Pet).save(
      m.getRepository(Pet).create({
        tutorId: tutorId.get(p.tutorId)!,
        nome: p.nome,
        especieId: especieId.get(p.especieId)!,
        racaId: racaId.get(p.racaId)!,
        sexo: p.sexo,
        cor: p.cor,
        pesoKg: p.pesoKg,
        dataNascimento: p.dataNascimento ?? null,
        dataFalecimento: p.dataFalecimento ?? null,
        observacoes: p.observacoes ?? null,
        criadoEm: new Date(p.criadoEm),
      }),
    );
    petId.set(p.id, saved.id);
  }
  console.log(`Pets demo: ${petsMock.length}`);

  // --- Ordens de serviço (com itens e histórico, números dos mocks) ---
  const osId = new Map<string, string>();
  for (const os of ordensServicoMock) {
    const saved = await m.getRepository(OrdemServico).save(
      m.getRepository(OrdemServico).create({
        numero: os.numero,
        tutorId: tutorId.get(os.tutorId)!,
        petId: petId.get(os.petId)!,
        usuarioCriadorId: usuarioPorNome(os.historico[0]?.usuarioNome ?? "").id,
        modalidadeId: modalidadeId.get(os.modalidadeId)!,
        status: os.status,
        total: os.total,
        dataFalecimento: os.dataFalecimento ?? null,
        observacoes: os.observacoes ?? null,
        criadoEm: new Date(os.criadoEm),
      }),
    );
    osId.set(os.id, saved.id);

    await m.getRepository(OSItem).save(
      os.itens.map((i) =>
        m.getRepository(OSItem).create({
          osId: saved.id,
          servicoProdutoId: servicoId.get(i.servicoProdutoId) ?? null,
          descricao: i.descricao,
          quantidade: i.quantidade,
          precoUnitario: i.precoUnitario,
        }),
      ),
    );
    await m.getRepository(HistoricoStatusOS).save(
      os.historico.map((h) =>
        m.getRepository(HistoricoStatusOS).create({
          osId: saved.id,
          status: h.status,
          ocorridoEm: new Date(h.ocorridoEm),
          usuarioId: usuarioPorNome(h.usuarioNome).id,
          usuarioNome: h.usuarioNome,
          observacao: h.observacao ?? null,
        }),
      ),
    );
  }
  console.log(`OS demo: ${ordensServicoMock.length}`);

  // --- Contratos (com pets e serviços vinculados) ---
  const contratoId = new Map<string, string>();
  for (const c of contratosMock) {
    const saved = await m.getRepository(Contrato).save(
      m.getRepository(Contrato).create({
        numero: c.numero,
        tutorId: tutorId.get(c.tutorId)!,
        modalidadeId: modalidadeId.get(c.modalidadeId)!,
        status: c.status,
        valorMensal: c.valorMensal,
        periodicidade: c.periodicidade,
        inicioVigencia: c.inicioVigencia,
        fimVigencia: c.fimVigencia ?? null,
        observacoes: c.observacoes ?? null,
        criadoEm: new Date(c.criadoEm),
      }),
    );
    contratoId.set(c.id, saved.id);
    await m
      .getRepository(ContratoPet)
      .save(
        c.petsIds.map((pid) =>
          m.getRepository(ContratoPet).create({ contratoId: saved.id, petId: petId.get(pid)! }),
        ),
      );
    await m
      .getRepository(ContratoServico)
      .save(
        c.servicosIds.map((sid) =>
          m
            .getRepository(ContratoServico)
            .create({ contratoId: saved.id, servicoProdutoId: servicoId.get(sid)! }),
        ),
      );
  }
  console.log(`Contratos demo: ${contratosMock.length}`);

  // --- Pagamentos + parcelas ---
  for (const p of pagamentosMock) {
    // Competência (1º dia do mês de criação) só para cobranças de contrato —
    // casa com o índice único (contrato_id, competencia).
    const criado = new Date(p.criadoEm);
    const competencia =
      p.origem === "contrato"
        ? `${criado.getUTCFullYear()}-${String(criado.getUTCMonth() + 1).padStart(2, "0")}-01`
        : null;
    const saved = await m.getRepository(OrdemPagamento).save(
      m.getRepository(OrdemPagamento).create({
        numero: p.numero,
        origem: p.origem,
        osId: p.ordemServicoId ? (osId.get(p.ordemServicoId) ?? null) : null,
        contratoId: p.contratoId ? (contratoId.get(p.contratoId) ?? null) : null,
        tutorId: tutorId.get(p.tutorId)!,
        valorTotal: p.valorTotal,
        status: p.status,
        competencia,
        criadoEm: criado,
      }),
    );
    await m.getRepository(Parcela).save(
      p.parcelas.map((par) =>
        m.getRepository(Parcela).create({
          ordemPagamentoId: saved.id,
          numero: par.numero,
          totalParcelas: p.parcelas.length,
          valor: par.valor,
          // "atrasado" é derivado na leitura — no banco fica "pendente".
          status: par.status === "atrasado" ? "pendente" : par.status,
          formaPagamento: par.metodo ?? null,
          dataVencimento: par.vencimento,
          dataRecebimento: par.pagaEm ?? null,
        }),
      ),
    );
  }
  console.log(`Pagamentos demo: ${pagamentosMock.length}`);

  // --- Sequências: avança os contadores para depois dos números usados acima ---
  const usados: Array<[string, string]> = [
    ...ordensServicoMock.map((o) => ["OS", o.numero] as [string, string]),
    ...contratosMock.map((c) => ["CT", c.numero] as [string, string]),
    ...pagamentosMock.map((p) => ["PG", p.numero] as [string, string]),
  ];
  const maxPorTipoAno = new Map<string, number>();
  for (const [tipo, numero] of usados) {
    const [, ano, seq] = numero.split("-");
    const key = `${tipo}:${ano}`;
    maxPorTipoAno.set(key, Math.max(maxPorTipoAno.get(key) ?? 0, parseInt(seq, 10)));
  }
  for (const [key, max] of maxPorTipoAno) {
    const [tipo, ano] = key.split(":");
    await m.query(
      `INSERT INTO sequencias (tipo, ano, ultimo_numero) VALUES ($1, $2, $3)
       ON CONFLICT (tipo, ano) DO UPDATE SET ultimo_numero = GREATEST(sequencias.ultimo_numero, $3)`,
      [tipo, parseInt(ano, 10), max],
    );
  }
  console.log(
    `Sequências ajustadas: ${[...maxPorTipoAno.entries()].map(([k, v]) => `${k}=${v}`).join(", ")}`,
  );
});

console.log("Seed demo concluído.");
await ds.destroy();
