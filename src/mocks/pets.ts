import type { Pet } from "@/types/pet";

export const petsMock: Pet[] = [
  // Maria Silva (tut-1)
  { id: "pet-1", tutorId: "tut-1", nome: "Thor", especieId: "esp-1", racaId: "raca-2", sexo: "macho", cor: "Dourado", pesoKg: 28, dataNascimento: "2014-03-12", dataFalecimento: "2026-05-30", criadoEm: "2025-08-12T14:00:00Z" },
  { id: "pet-2", tutorId: "tut-1", nome: "Mia", especieId: "esp-2", racaId: "raca-8", sexo: "femea", cor: "Branca", pesoKg: 4.2, dataNascimento: "2018-06-20", criadoEm: "2025-08-12T14:05:00Z" },

  // João Souza (tut-2)
  { id: "pet-3", tutorId: "tut-2", nome: "Mel", especieId: "esp-1", racaId: "raca-4", sexo: "femea", cor: "Caramelo", pesoKg: 3.8, dataNascimento: "2012-09-01", dataFalecimento: "2026-04-18", criadoEm: "2025-09-04T10:15:00Z" },

  // Ana Lima (tut-3)
  { id: "pet-4", tutorId: "tut-3", nome: "Luna", especieId: "esp-2", racaId: "raca-7", sexo: "femea", cor: "Tricolor", pesoKg: 3.5, dataNascimento: "2015-11-04", dataFalecimento: "2026-05-12", criadoEm: "2025-10-22T08:45:00Z" },
  { id: "pet-5", tutorId: "tut-3", nome: "Bóris", especieId: "esp-2", racaId: "raca-10", sexo: "macho", cor: "Cinza", pesoKg: 6.4, dataNascimento: "2019-02-10", criadoEm: "2025-10-22T08:50:00Z" },

  // Rafael Mendes (tut-4)
  { id: "pet-6", tutorId: "tut-4", nome: "Bento", especieId: "esp-1", racaId: "raca-6", sexo: "macho", cor: "Branco e preto", pesoKg: 11, dataNascimento: "2017-07-22", criadoEm: "2025-11-03T16:30:00Z" },

  // Patrícia Costa (tut-5)
  { id: "pet-7", tutorId: "tut-5", nome: "Pipoca", especieId: "esp-1", racaId: "raca-5", sexo: "femea", cor: "Preta", pesoKg: 5.1, dataNascimento: "2013-01-15", dataFalecimento: "2026-06-01", criadoEm: "2025-12-15T11:20:00Z" },

  // Lucas Pereira (tut-6)
  { id: "pet-8", tutorId: "tut-6", nome: "Nick", especieId: "esp-1", racaId: "raca-3", sexo: "macho", cor: "Preto", pesoKg: 32, dataNascimento: "2016-04-08", criadoEm: "2026-01-08T09:00:00Z" },

  // Beatriz Rocha (tut-7) — possui contrato
  { id: "pet-9", tutorId: "tut-7", nome: "Toby", especieId: "esp-1", racaId: "raca-1", sexo: "macho", cor: "Caramelo", pesoKg: 14, dataNascimento: "2016-10-30", criadoEm: "2026-02-19T15:00:00Z" },
  { id: "pet-10", tutorId: "tut-7", nome: "Lola", especieId: "esp-2", racaId: "raca-9", sexo: "femea", cor: "Creme", pesoKg: 4.0, dataNascimento: "2017-05-25", criadoEm: "2026-02-19T15:05:00Z" },

  // Gustavo Martins (tut-8)
  { id: "pet-11", tutorId: "tut-8", nome: "Chico", especieId: "esp-3", racaId: "raca-11", sexo: "macho", cor: "Acinzentado", pesoKg: 1.8, dataNascimento: "2020-08-14", criadoEm: "2026-03-10T13:45:00Z" },
];