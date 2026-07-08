import type { MigrationInterface, QueryRunner } from "typeorm";

export class InitialSchema1783015793967 implements MigrationInterface {
  name = "InitialSchema1783015793967";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // gen_random_uuid() é nativo desde o PG13, mas habilitamos pgcrypto mesmo assim
    // para funcionar também em instâncias gerenciadas mais antigas.
    await queryRunner.query(`CREATE EXTENSION IF NOT EXISTS pgcrypto`);
    await queryRunner.query(
      `CREATE TABLE "tutores" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "nome" character varying(200) NOT NULL, "cpf" character varying(11) NOT NULL, "email" character varying(200) NOT NULL, "telefone" character varying(20) NOT NULL, "cep" character varying(8) NOT NULL, "logradouro" character varying(200) NOT NULL, "numero" character varying(20) NOT NULL, "complemento" character varying(100), "bairro" character varying(100) NOT NULL, "cidade" character varying(100) NOT NULL, "uf" character(2) NOT NULL, "observacoes" text, "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_017ed34d9aa4c98126224949fe9" UNIQUE ("cpf"), CONSTRAINT "PK_fdb2e70ac9a26d6a5095c87b681" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "pets" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "tutor_id" uuid NOT NULL, "especie_id" uuid, "raca_id" uuid, "nome" character varying(100) NOT NULL, "sexo" character varying(10) NOT NULL, "cor" character varying(80) NOT NULL, "peso_kg" numeric(6,2) NOT NULL, "data_nascimento" date, "data_falecimento" date, "observacoes" text, "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_d01e9e7b4ada753c826720bee8b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "racas" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "especie_id" uuid NOT NULL, "nome" character varying(100) NOT NULL, "ativo" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_f213506e4d2c904d32c18f36c87" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "especies" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "nome" character varying(100) NOT NULL, "ativo" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_70834d4dbe37dd6c09283840e5d" UNIQUE ("nome"), CONSTRAINT "PK_c9453cb57d74843ba2c7ad220ca" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "modalidades_servico" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "nome" character varying(100) NOT NULL, "descricao" text, "ativo" boolean NOT NULL DEFAULT true, CONSTRAINT "UQ_2d304d2a6fa5832fe05684ebd57" UNIQUE ("nome"), CONSTRAINT "PK_738791783ec6c9bcdfe9b350ff1" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "servicos_produtos" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "nome" character varying(200) NOT NULL, "tipo" character varying(30) NOT NULL, "descricao" text, "preco" numeric(10,2) NOT NULL DEFAULT '0', "ativo" boolean NOT NULL DEFAULT true, "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_a80f3eea1073959c323704d9272" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "usuarios" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "nome" character varying(200) NOT NULL, "email" character varying(200) NOT NULL, "senha_hash" text NOT NULL, "role" character varying(20) NOT NULL DEFAULT 'recepcao', "ativo" boolean NOT NULL DEFAULT true, "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_446adfc18b35418aac32ae0b7b5" UNIQUE ("email"), CONSTRAINT "PK_d7281c63c176e152e4c531594a8" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "os_itens" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "os_id" uuid NOT NULL, "servico_produto_id" uuid, "descricao" character varying(200) NOT NULL, "quantidade" integer NOT NULL DEFAULT '1', "preco_unitario" numeric(10,2) NOT NULL, "subtotal" numeric(10,2) GENERATED ALWAYS AS ("quantidade" * "preco_unitario") STORED NOT NULL, CONSTRAINT "PK_a67392d863658e9b6e939e9be4c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "historico_status_os" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "os_id" uuid NOT NULL, "status" character varying(30) NOT NULL, "ocorrido_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "usuario_id" uuid NOT NULL, "usuario_nome" character varying(200) NOT NULL, "observacao" text, CONSTRAINT "PK_5c5e2b6ad6b5eb26ae5c9e4ab59" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ordens_servico" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "numero" character varying(20) NOT NULL, "pet_id" uuid NOT NULL, "tutor_id" uuid NOT NULL, "usuario_criador_id" uuid NOT NULL, "modalidade_id" uuid NOT NULL, "status" character varying(30) NOT NULL DEFAULT 'aguardando_coleta', "total" numeric(10,2) NOT NULL DEFAULT '0', "data_falecimento" date, "observacoes" text, "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "atualizado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_8b331ce2bd7f6dc359db37bbcc8" UNIQUE ("numero"), CONSTRAINT "PK_7e88933ca1acb36785ccb55a34c" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "contrato_pets" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "contrato_id" uuid NOT NULL, "pet_id" uuid NOT NULL, CONSTRAINT "PK_a4e2b0a7edf2f4242255d7a2e36" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "contrato_servicos" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "contrato_id" uuid NOT NULL, "servico_produto_id" uuid NOT NULL, CONSTRAINT "PK_602ac8d5a61b91c5347507b69e0" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "contratos" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "numero" character varying(20) NOT NULL, "tutor_id" uuid NOT NULL, "modalidade_id" uuid NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'ativo', "valor_mensal" numeric(10,2) NOT NULL, "periodicidade" character varying(20) NOT NULL DEFAULT 'mensal', "inicio_vigencia" date NOT NULL, "fim_vigencia" date, "observacoes" text, "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_118d425b390cd16aa23be3d675c" UNIQUE ("numero"), CONSTRAINT "PK_cfae35069d6f59da899c17ed397" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "parcelas" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "ordem_pagamento_id" uuid NOT NULL, "numero" integer NOT NULL, "total_parcelas" integer NOT NULL, "valor" numeric(10,2) NOT NULL, "forma_pagamento" character varying(30), "status" character varying(20) NOT NULL DEFAULT 'pendente', "data_vencimento" date NOT NULL, "data_recebimento" date, "observacao" text, "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "PK_2081f431fed935a5bb1da9f420b" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE TABLE "ordens_pagamento" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "numero" character varying(20) NOT NULL, "origem" character varying(20) NOT NULL, "os_id" uuid, "contrato_id" uuid, "tutor_id" uuid NOT NULL, "valor_total" numeric(10,2) NOT NULL, "status" character varying(20) NOT NULL DEFAULT 'aberto', "competencia" date, "criado_em" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_db33c64397c9239e11c4169f5fd" UNIQUE ("numero"), CONSTRAINT "PK_0a0406bac6db5cf982d7e805005" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_1dbdc96f1ceb134d1d1cdeb48e" ON "ordens_pagamento"  ("contrato_id", "competencia") `,
    );
    await queryRunner.query(
      `CREATE TABLE "sequencias" ("tipo" character varying(4) NOT NULL, "ano" integer NOT NULL, "ultimo_numero" integer NOT NULL DEFAULT '0', CONSTRAINT "PK_d3cc865bea6162820f596e524bb" PRIMARY KEY ("tipo", "ano"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "pets" ADD CONSTRAINT "FK_eb990a74dbc1c946095cba08d38" FOREIGN KEY ("tutor_id") REFERENCES "tutores"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pets" ADD CONSTRAINT "FK_5555b62fa84c50594d6ace34a18" FOREIGN KEY ("especie_id") REFERENCES "especies"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "pets" ADD CONSTRAINT "FK_8c4a571273ea3458efdbe2b1546" FOREIGN KEY ("raca_id") REFERENCES "racas"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "racas" ADD CONSTRAINT "FK_5b016af14da5c2cb184f05d0c0f" FOREIGN KEY ("especie_id") REFERENCES "especies"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "os_itens" ADD CONSTRAINT "FK_da22e01f43f0fd8d3a8f6144e10" FOREIGN KEY ("os_id") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "os_itens" ADD CONSTRAINT "FK_7df1f5b512f620f940ec9e9a02c" FOREIGN KEY ("servico_produto_id") REFERENCES "servicos_produtos"("id") ON DELETE SET NULL ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "historico_status_os" ADD CONSTRAINT "FK_ac18ccb336050ffcb2ebd31baac" FOREIGN KEY ("os_id") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "historico_status_os" ADD CONSTRAINT "FK_4e08d54c6566f7f78c892a5dcdc" FOREIGN KEY ("usuario_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordens_servico" ADD CONSTRAINT "FK_9785208d0cb6a41d4cb2a1a1750" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordens_servico" ADD CONSTRAINT "FK_fe1e9af1ac6b4bbbe31cd3a2f34" FOREIGN KEY ("tutor_id") REFERENCES "tutores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordens_servico" ADD CONSTRAINT "FK_54830d05f2d66a5c8a5fac77f81" FOREIGN KEY ("usuario_criador_id") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordens_servico" ADD CONSTRAINT "FK_dfd7d6c3cd6f10abf55504418f2" FOREIGN KEY ("modalidade_id") REFERENCES "modalidades_servico"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contrato_pets" ADD CONSTRAINT "FK_1386d22c4dbe3a505adeca824da" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contrato_pets" ADD CONSTRAINT "FK_d7db623aceff71b918645d4e8a6" FOREIGN KEY ("pet_id") REFERENCES "pets"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contrato_servicos" ADD CONSTRAINT "FK_961ebb7f415bbef7cd094f4bf8e" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contrato_servicos" ADD CONSTRAINT "FK_9c4b0ae45bc1effe05f68e50dbc" FOREIGN KEY ("servico_produto_id") REFERENCES "servicos_produtos"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contratos" ADD CONSTRAINT "FK_8b39d5c0576ad7002c2c487d8a2" FOREIGN KEY ("tutor_id") REFERENCES "tutores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "contratos" ADD CONSTRAINT "FK_8c467c1810169ce895326a624ea" FOREIGN KEY ("modalidade_id") REFERENCES "modalidades_servico"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "parcelas" ADD CONSTRAINT "FK_933fa06d566d960af2e73835796" FOREIGN KEY ("ordem_pagamento_id") REFERENCES "ordens_pagamento"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordens_pagamento" ADD CONSTRAINT "FK_6070da0f246fb6bcbc602ec92b3" FOREIGN KEY ("os_id") REFERENCES "ordens_servico"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordens_pagamento" ADD CONSTRAINT "FK_7985fc61a942772dac9974365a4" FOREIGN KEY ("contrato_id") REFERENCES "contratos"("id") ON DELETE CASCADE ON UPDATE NO ACTION`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordens_pagamento" ADD CONSTRAINT "FK_075a2cbed1fbf24284eafaf711e" FOREIGN KEY ("tutor_id") REFERENCES "tutores"("id") ON DELETE RESTRICT ON UPDATE NO ACTION`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "ordens_pagamento" DROP CONSTRAINT "FK_075a2cbed1fbf24284eafaf711e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordens_pagamento" DROP CONSTRAINT "FK_7985fc61a942772dac9974365a4"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordens_pagamento" DROP CONSTRAINT "FK_6070da0f246fb6bcbc602ec92b3"`,
    );
    await queryRunner.query(
      `ALTER TABLE "parcelas" DROP CONSTRAINT "FK_933fa06d566d960af2e73835796"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contratos" DROP CONSTRAINT "FK_8c467c1810169ce895326a624ea"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contratos" DROP CONSTRAINT "FK_8b39d5c0576ad7002c2c487d8a2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contrato_servicos" DROP CONSTRAINT "FK_9c4b0ae45bc1effe05f68e50dbc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contrato_servicos" DROP CONSTRAINT "FK_961ebb7f415bbef7cd094f4bf8e"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contrato_pets" DROP CONSTRAINT "FK_d7db623aceff71b918645d4e8a6"`,
    );
    await queryRunner.query(
      `ALTER TABLE "contrato_pets" DROP CONSTRAINT "FK_1386d22c4dbe3a505adeca824da"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordens_servico" DROP CONSTRAINT "FK_dfd7d6c3cd6f10abf55504418f2"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordens_servico" DROP CONSTRAINT "FK_54830d05f2d66a5c8a5fac77f81"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordens_servico" DROP CONSTRAINT "FK_fe1e9af1ac6b4bbbe31cd3a2f34"`,
    );
    await queryRunner.query(
      `ALTER TABLE "ordens_servico" DROP CONSTRAINT "FK_9785208d0cb6a41d4cb2a1a1750"`,
    );
    await queryRunner.query(
      `ALTER TABLE "historico_status_os" DROP CONSTRAINT "FK_4e08d54c6566f7f78c892a5dcdc"`,
    );
    await queryRunner.query(
      `ALTER TABLE "historico_status_os" DROP CONSTRAINT "FK_ac18ccb336050ffcb2ebd31baac"`,
    );
    await queryRunner.query(
      `ALTER TABLE "os_itens" DROP CONSTRAINT "FK_7df1f5b512f620f940ec9e9a02c"`,
    );
    await queryRunner.query(
      `ALTER TABLE "os_itens" DROP CONSTRAINT "FK_da22e01f43f0fd8d3a8f6144e10"`,
    );
    await queryRunner.query(`ALTER TABLE "racas" DROP CONSTRAINT "FK_5b016af14da5c2cb184f05d0c0f"`);
    await queryRunner.query(`ALTER TABLE "pets" DROP CONSTRAINT "FK_8c4a571273ea3458efdbe2b1546"`);
    await queryRunner.query(`ALTER TABLE "pets" DROP CONSTRAINT "FK_5555b62fa84c50594d6ace34a18"`);
    await queryRunner.query(`ALTER TABLE "pets" DROP CONSTRAINT "FK_eb990a74dbc1c946095cba08d38"`);
    await queryRunner.query(`DROP TABLE "sequencias"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_1dbdc96f1ceb134d1d1cdeb48e"`);
    await queryRunner.query(`DROP TABLE "ordens_pagamento"`);
    await queryRunner.query(`DROP TABLE "parcelas"`);
    await queryRunner.query(`DROP TABLE "contratos"`);
    await queryRunner.query(`DROP TABLE "contrato_servicos"`);
    await queryRunner.query(`DROP TABLE "contrato_pets"`);
    await queryRunner.query(`DROP TABLE "ordens_servico"`);
    await queryRunner.query(`DROP TABLE "historico_status_os"`);
    await queryRunner.query(`DROP TABLE "os_itens"`);
    await queryRunner.query(`DROP TABLE "usuarios"`);
    await queryRunner.query(`DROP TABLE "servicos_produtos"`);
    await queryRunner.query(`DROP TABLE "modalidades_servico"`);
    await queryRunner.query(`DROP TABLE "especies"`);
    await queryRunner.query(`DROP TABLE "racas"`);
    await queryRunner.query(`DROP TABLE "pets"`);
    await queryRunner.query(`DROP TABLE "tutores"`);
  }
}
