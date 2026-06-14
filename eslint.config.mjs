import { dirname } from "path";
import { fileURLToPath } from "url";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const compat = new FlatCompat({
  baseDirectory: __dirname,
});

const eslintConfig = [
  ...compat.extends("next/core-web-vitals", "next/typescript"),
  {
    ignores: [
      "node_modules/**",
      ".next/**",
      "out/**",
      "build/**",
      "next-env.d.ts",
    ],
  },
  {
    // Reglas globales relajadas para el proyecto
    rules: {
      "@typescript-eslint/no-explicit-any": "warn",          // degradado de error a warning
      "react/no-unescaped-entities": "off",                   // JSX maneja comillas correctamente
      "@typescript-eslint/no-unused-vars": ["warn", {         // degradado a warning, permite _prefijos
        "argsIgnorePattern": "^_",
        "varsIgnorePattern": "^_",
      }],
    },
  },
  {
    // En tests se permiten `any` para mockear con vi.fn()
    files: ["src/__tests__/**/*.ts", "src/__tests__/**/*.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
    },
  },
];

export default eslintConfig;

