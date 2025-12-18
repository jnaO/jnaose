import { defineConfig } from "eslint/config";
import nextCoreWebVitals from "eslint-config-next/core-web-vitals";
import { fixupConfigRules, fixupPluginRules } from "@eslint/compat";
import typescriptEslint from "@typescript-eslint/eslint-plugin";
import _import from "eslint-plugin-import";
import react from "eslint-plugin-react";
import unusedImports from "eslint-plugin-unused-imports";
import prettier from "eslint-plugin-prettier";
import globals from "globals";
import tsParser from "@typescript-eslint/parser";
import path from "node:path";
import { fileURLToPath } from "node:url";
import js from "@eslint/js";
import { FlatCompat } from "@eslint/eslintrc";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
    baseDirectory: __dirname,
    recommendedConfig: js.configs.recommended,
    allConfig: js.configs.all
});

export default defineConfig([{
    extends: fixupConfigRules(compat.extends(
        "airbnb",
        "next/core-web-vitals",
        "plugin:import/errors",
        "plugin:import/typescript",
        "plugin:import/warnings",
        "plugin:react/recommended",
        "prettier",
    )),

    plugins: {
        "@typescript-eslint": typescriptEslint,
        import: fixupPluginRules(_import),
        react: fixupPluginRules(react),
        "unused-imports": unusedImports,
        prettier,
    },

    languageOptions: {
        globals: {
            ...globals.browser,
            ...globals.commonjs,
            ...globals.jest,
            ...globals.jquery,
            ...globals.node,
            JSX: true,
        },

        parser: tsParser,
        ecmaVersion: 12,
        sourceType: "module",

        parserOptions: {
            ecmaFeatures: {
                jsx: true,
            },
        },
    },

    settings: {
        react: {
            version: "16.12.0",
        },

        "import/extensions": [".js", ".jsx", ".ts", ".tsx"],
    },

    rules: {
        "import/order": ["error", {
            groups: ["builtin", "external", "internal", ["parent", "sibling"]],

            pathGroups: [{
                pattern: "react",
                group: "external",
                position: "before",
            }],

            pathGroupsExcludedImportTypes: ["react"],
            "newlines-between": "always",

            alphabetize: {
                order: "asc",
                caseInsensitive: true,
            },
        }],

        "react/react-in-jsx-scope": "off",
        "@next/next/no-img-element": "off",
        "@typescript-eslint/no-shadow": ["error"],
        "@typescript-eslint/no-unused-vars": "off",
        "@typescript-eslint/no-use-before-define": ["error"],
        "consistent-return": "off",
        "global-require": "off",
        "import/default": 2,
        "import/export": 2,

        "import/extensions": ["error", "ignorePackages", {
            js: "never",
            jsx: "never",
            ts: "never",
            tsx: "never",
        }],

        "import/namespace": 2,
        "import/no-unresolved": "off",
        "jsx-a11y/anchor-is-valid": "off",
        "jsx-a11y/click-events-have-key-events": "off",
        "jsx-a11y/control-has-associated-label": "off",
        "jsx-a11y/interactive-supports-focus": "off",
        "jsx-a11y/label-has-associated-control": "off",
        "jsx-a11y/no-autofocus": "off",
        "jsx-a11y/no-noninteractive-element-interactions": "off",
        "jsx-a11y/no-redundant-roles": "off",
        "jsx-a11y/no-static-element-interactions": "off",
        "jsx-a11y/role-has-required-aria-props": "off",

        "no-console": ["error", {
            allow: ["error"],
        }],

        "no-param-reassign": "off",
        "no-restricted-syntax": "off",
        "no-shadow": "off",
        "no-unused-vars": "off",
        "no-use-before-define": "off",

        "prettier/prettier": ["error", {
            arrowParens: "avoid",
            semi: false,
            trailingComma: "all",
            singleQuote: true,
            printWidth: 80,
        }],

        "react/button-has-type": ["error", {
            reset: true,
        }],

        "react/destructuring-assignment": "off",
        "react/forbid-prop-types": "off",

        "react/jsx-filename-extension": ["error", {
            extensions: [".tsx"],
        }],

        "react/jsx-props-no-spreading": "off",
        "react/no-array-index-key": "off",
        "react/no-unused-prop-types": "off",
        "react/require-default-props": "off",
        "unused-imports/no-unused-imports-ts": "error",

        "import/prefer-default-export": ["off", {
            target: "any",
        }],
    },
}]);