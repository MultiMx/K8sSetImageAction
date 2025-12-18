import commonjs from "@rollup/plugin-commonjs";
import nodeResolve from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import typescript from "@rollup/plugin-typescript";

const config = {
  input: "src/index.ts",
  output: {
    esModule: true,
    file: "dist/index.js",
    format: "es",
    sourcemap: false,
  },
  plugins: [
    commonjs(),
    nodeResolve({ preferBuiltins: true }),
    typescript(),
    json(),
  ],
};

export default config;
