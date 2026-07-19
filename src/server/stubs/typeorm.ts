// Build-time stub for TypeORM used only when the Lovable sandbox forces a
// cloudflare-module Nitro build (build:dev harness). The real app runs on
// Railway with Nitro's Node preset via `npm run build`, where the actual
// typeorm package is bundled. This stub keeps the sandbox build green.
/* eslint-disable @typescript-eslint/no-explicit-any */
const notAvailable = () => {
  throw new Error(
    "TypeORM stub invoked: the real typeorm package isn't bundled in the Lovable sandbox build. This code path only runs on the Railway Node deploy.",
  );
};

class Stub {
  constructor() {
    return new Proxy(this, {
      get: () => notAvailable,
    });
  }
}

export class DataSource extends Stub {}
export class Repository extends Stub {}
export class EntityManager extends Stub {}
export class QueryRunner extends Stub {}
export class MigrationInterface extends Stub {}
export class BaseEntity extends Stub {}

export const Entity = () => () => {};
export const Column = () => () => {};
export const PrimaryColumn = () => () => {};
export const PrimaryGeneratedColumn = () => () => {};
export const CreateDateColumn = () => () => {};
export const UpdateDateColumn = () => () => {};
export const DeleteDateColumn = () => () => {};
export const ManyToOne = () => () => {};
export const OneToMany = () => () => {};
export const OneToOne = () => () => {};
export const ManyToMany = () => () => {};
export const JoinColumn = () => () => {};
export const JoinTable = () => () => {};
export const Index = () => () => {};
export const Unique = () => () => {};
export const Check = () => () => {};
export const BeforeInsert = () => () => {};
export const BeforeUpdate = () => () => {};
export const AfterLoad = () => () => {};
export const VirtualColumn = () => () => {};
export const RelationId = () => () => {};
export const Generated = () => () => {};
export const Tree = () => () => {};
export const TreeChildren = () => () => {};
export const TreeParent = () => () => {};

export type FindOptionsWhere<T> = any;
export type FindManyOptions<T> = any;
export type FindOneOptions<T> = any;
export type DeepPartial<T> = any;
export type ObjectLiteral = any;
export type EntitySchema<T = any> = any;
export type QueryRunnerType = any;

export const In = (values: any) => values;
export const Not = (value: any) => value;
export const IsNull = () => null;
export const Like = (value: any) => value;
export const ILike = (value: any) => value;
export const Between = (a: any, b: any) => [a, b];
export const LessThan = (v: any) => v;
export const LessThanOrEqual = (v: any) => v;
export const MoreThan = (v: any) => v;
export const MoreThanOrEqual = (v: any) => v;
export const Raw = (v: any) => v;

export default {};
