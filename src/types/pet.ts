export type SexoPet = "macho" | "femea";

export type Pet = {
  id: string;
  tutorId: string;
  nome: string;
  especieId: string;
  racaId: string;
  sexo: SexoPet;
  cor: string;
  pesoKg: number;
  dataNascimento?: string;
  /** Quando preenchida, o pet é considerado falecido. */
  dataFalecimento?: string;
  observacoes?: string;
  criadoEm: string;
};