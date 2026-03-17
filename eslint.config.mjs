import { createRequire } from "module";

const require = createRequire(import.meta.url);
const nextPlugin = require("@next/eslint-plugin-next");

export default [
  {
    ignores: [".next/**", "node_modules/**", "dist/**", "out/**"],
  },
  nextPlugin.configs["core-web-vitals"],
];

