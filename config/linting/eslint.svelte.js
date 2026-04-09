module.exports = {
    env: {
        browser: true,
        es2021: true,
        node: true,
    },
    plugins: ["@typescript-eslint", "jsdoc", "prefer-arrow"],
    overrides: [
        {
            files: ["*.svelte"],
            parser: "svelte-eslint-parser",
            parserOptions: {
                parser: "@typescript-eslint/parser",
            },
        },
    ],
    extends: ["plugin:@typescript-eslint/recommended", "plugin:@typescript-eslint/recommended-type-checked", "plugin:svelte/recommended", "prettier"],
    parser: "@typescript-eslint/parser",
    parserOptions: {
        project: "config/typescript/tsconfig.svelte.json",
        ecmaVersion: 2021,
        sourceType: "module",
        extraFileExtensions: [".svelte"],
    },
    rules: {
        "@typescript-eslint/no-floating-promises": "off",
        "@typescript-eslint/no-misused-promises": "off",
        "@typescript-eslint/no-implied-eval": "off",
        "@typescript-eslint/no-unused-vars": ["error", { varsIgnorePattern: "^_", argsIgnorePattern: "^_" }],
        "@typescript-eslint/restrict-plus-operands": "off",
        "@typescript-eslint/no-non-null-assertion": "off",
        "@typescript-eslint/naming-convention": "off",
        "@typescript-eslint/restrict-template-expressions": "off",
        "@typescript-eslint/no-unsafe-member-access": "off",
        "@typescript-eslint/no-unsafe-assignment": "off",
        "@typescript-eslint/no-unsafe-argument": "off",
        "@typescript-eslint/no-unsafe-return": "off",
        "@typescript-eslint/no-explicit-any": "off",
        "@typescript-eslint/no-unsafe-call": "off",
        "@typescript-eslint/ban-ts-comment": "off",
    },
};
