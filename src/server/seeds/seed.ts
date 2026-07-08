import bcrypt from "bcryptjs";
import { getDataSource } from "../data-source";
import { Especie, Raca, ModalidadeServico, ServicoProduto, Usuario } from "../entities";

const ds = await getDataSource();

// --- Usuários (mesmas credenciais que o frontend usava mockadas) ---
const usuarioRepo = ds.getRepository(Usuario);
const senhaHash = await bcrypt.hash("123456", 10);
const usuarios: Array<Pick<Usuario, "nome" | "email" | "role">> = [
  { nome: "Ana Administradora", email: "admin@qamigo.com", role: "admin" },
  { nome: "Otávio Operacional", email: "op@qamigo.com", role: "operacional" },
  { nome: "Fernanda Financeiro", email: "fin@qamigo.com", role: "financeiro" },
  { nome: "Renata Recepção", email: "rec@qamigo.com", role: "recepcao" },
];
for (const u of usuarios) {
  const existing = await usuarioRepo.findOne({ where: { email: u.email } });
  if (existing) continue;
  await usuarioRepo.save(usuarioRepo.create({ ...u, senhaHash }));
}
console.log(`Usuários: ${usuarios.length} (senha "123456" para todos)`);

// --- Espécies ---
const especieRepo = ds.getRepository(Especie);
const especiesSeed = [
  { nome: "Cão", ativo: true },
  { nome: "Gato", ativo: true },
  { nome: "Coelho", ativo: true },
  { nome: "Ave", ativo: false },
];
const especiesByNome = new Map<string, Especie>();
for (const e of especiesSeed) {
  let row = await especieRepo.findOne({ where: { nome: e.nome } });
  if (!row) row = await especieRepo.save(especieRepo.create(e));
  especiesByNome.set(e.nome, row);
}
console.log(`Espécies: ${especiesSeed.length}`);

// --- Raças (vinculadas às espécies acima) ---
const racaRepo = ds.getRepository(Raca);
const racasSeed = [
  { especie: "Cão", nome: "SRD" },
  { especie: "Cão", nome: "Golden Retriever" },
  { especie: "Cão", nome: "Labrador" },
  { especie: "Cão", nome: "Yorkshire" },
  { especie: "Cão", nome: "Pinscher" },
  { especie: "Cão", nome: "Bulldog Francês" },
  { especie: "Gato", nome: "SRD" },
  { especie: "Gato", nome: "Persa" },
  { especie: "Gato", nome: "Siamês" },
  { especie: "Gato", nome: "Maine Coon" },
  { especie: "Coelho", nome: "Holandês" },
];
for (const r of racasSeed) {
  const especie = especiesByNome.get(r.especie)!;
  const existing = await racaRepo.findOne({ where: { especieId: especie.id, nome: r.nome } });
  if (existing) continue;
  await racaRepo.save(racaRepo.create({ especieId: especie.id, nome: r.nome, ativo: true }));
}
console.log(`Raças: ${racasSeed.length}`);

// --- Modalidades de serviço ---
const modalidadeRepo = ds.getRepository(ModalidadeServico);
const modalidadesSeed = [
  { nome: "Cremação individual", descricao: "Cinzas devolvidas ao tutor." },
  { nome: "Cremação coletiva", descricao: "Sem devolução de cinzas." },
  { nome: "Sepultamento", descricao: "Sepultamento em jazigo conveniado." },
  { nome: "Velório", descricao: "Sala de velório por 2 horas." },
];
for (const m of modalidadesSeed) {
  const existing = await modalidadeRepo.findOne({ where: { nome: m.nome } });
  if (existing) continue;
  await modalidadeRepo.save(modalidadeRepo.create({ ...m, ativo: true }));
}
console.log(`Modalidades: ${modalidadesSeed.length}`);

// --- Serviços e produtos ---
const servicoRepo = ds.getRepository(ServicoProduto);
const servicosSeed: Array<Pick<ServicoProduto, "nome" | "tipo" | "preco">> = [
  { nome: "Cremação individual até 10kg", tipo: "servico", preco: 480 },
  { nome: "Cremação individual 10–25kg", tipo: "servico", preco: 720 },
  { nome: "Cremação individual acima de 25kg", tipo: "servico", preco: 980 },
  { nome: "Cremação coletiva", tipo: "servico", preco: 280 },
  { nome: "Coleta domiciliar (até 20km)", tipo: "servico", preco: 120 },
  { nome: "Velório 2h", tipo: "servico", preco: 350 },
  { nome: "Urna decorativa madeira", tipo: "produto", preco: 220 },
  { nome: "Urna biodegradável", tipo: "produto", preco: 160 },
  { nome: "Placa memorial gravada", tipo: "produto", preco: 95 },
  { nome: "Pata em resina", tipo: "produto", preco: 75 },
];
for (const s of servicosSeed) {
  const existing = await servicoRepo.findOne({ where: { nome: s.nome } });
  if (existing) continue;
  await servicoRepo.save(servicoRepo.create({ ...s, ativo: true }));
}
console.log(`Serviços/produtos: ${servicosSeed.length}`);

console.log("Seed concluído.");
await ds.destroy();
