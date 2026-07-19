// Use the physical ESM file by relative path. `tinyglobby` intentionally does not
// export the `./dist/index.mjs` subpath, so a package subpath import is rejected by
// Vite/Rollup before this compatibility shim can be bundled.
import { convertPathToPattern, escapePath, glob, globSync, isDynamicPattern } from "../../../node_modules/tinyglobby/dist/index.mjs";
export { convertPathToPattern, escapePath, glob, globSync, isDynamicPattern };
export default { convertPathToPattern, escapePath, glob, globSync, isDynamicPattern };
