// Shim to provide both named and default exports for tinyglobby so Rollup CJS
// interop (used by TypeORM's DirectoryExportedClassesLoader) resolves cleanly.
import * as all from "tinyglobby/dist/index.mjs";
export const { convertPathToPattern, escapePath, glob, globSync, isDynamicPattern } = all;
export default all;
