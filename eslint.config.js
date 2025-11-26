import js from '@eslint/js';
import stylistic from '@stylistic/eslint-plugin';
import eslintPluginQuery from '@tanstack/eslint-plugin-query';
import eslintPluginRouter from '@tanstack/eslint-plugin-router';
import TypeScriptESLint from '@typescript-eslint/eslint-plugin';
import parser from '@typescript-eslint/parser';
import eslintPluginImport from 'eslint-plugin-import';
import eslintPluginPerfectionist from 'eslint-plugin-perfectionist';
import eslintPluginReact from 'eslint-plugin-react';
import eslintPluginReactHooks from 'eslint-plugin-react-hooks';
import eslintPluginReactRefresh from 'eslint-plugin-react-refresh';
import globals from 'globals';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const commonRules = {
    ...js.configs.recommended.rules,
    ...(eslintPluginImport.flatConfigs.recommended?.rules ?? eslintPluginImport.flatConfigs.recommended),
    ...(eslintPluginPerfectionist.configs['recommended-natural']?.rules ?? eslintPluginPerfectionist.configs['recommended-natural']),
    'comma-dangle': [2, {
        arrays   : 'always-multiline',
        exports  : 'never',
        functions: 'never',
        imports  : 'never',
        objects  : 'always-multiline',
    }],
    'comma-spacing'       : [2, {after: true, before: false}],
    'eol-last'            : 2,
    'import/no-unresolved': 0,
    'key-spacing'         : [2, {align: 'colon'}],
    'new-cap'             : [2, {capIsNew: false}],
    'no-multi-spaces'     : [2, {exceptions: {Property: true, TSPropertySignature: true}}],
    'no-trailing-spaces'  : 2,
    'no-unused-vars'      : 0,
    'object-curly-newline': [2, {
        ObjectExpression: {
            consistent: true, minProperties: 0, multiline: true,
        },
        ObjectPattern: {
            consistent: true, minProperties: 0, multiline: true,
        },
    }],
    'object-curly-spacing': [2, 'never'],
    'object-shorthand'    : [2, 'always'],
    'prefer-template'     : 2,
    'quote-props'         : [2, 'as-needed'],
    quotes                : [2, 'single'],
    semi                  : 2,
};

const typescriptRules = {
    ...(TypeScriptESLint.configs.eslintRecommended?.rules ?? TypeScriptESLint.configs.eslintRecommended),
    ...(TypeScriptESLint.configs.recommendedTypeChecked?.rules ?? TypeScriptESLint.configs.recommendedTypeChecked),
    ...(TypeScriptESLint.configs.strictTypeChecked?.rules ?? TypeScriptESLint.configs.strictTypeChecked),
    ...(eslintPluginImport.flatConfigs.typescript?.rules ?? eslintPluginImport.flatConfigs.typescript),
    '@stylistic/indent'                               : [2, 4],
    '@typescript-eslint/consistent-type-definitions'  : 2,
    '@typescript-eslint/consistent-type-exports'      : 2,
    '@typescript-eslint/consistent-type-imports'      : 2,
    '@typescript-eslint/explicit-function-return-type': [2, {
        allowConciseArrowFunctionExpressionsStartingWithVoid: true,
        allowDirectConstAssertionInArrowFunctions           : true,
    }],
    '@typescript-eslint/naming-convention'           : 0,
    '@typescript-eslint/no-explicit-any'             : 0,
    '@typescript-eslint/no-extraneous-class'         : [2, {allowWithDecorator: true}],
    '@typescript-eslint/no-non-null-assertion'       : 1,
    '@typescript-eslint/no-unsafe-assignment'        : 1,
    '@typescript-eslint/no-unsafe-call'              : 1,
    '@typescript-eslint/no-unused-expressions'       : [2, {allowTernary: true}],
    '@typescript-eslint/no-unused-vars'              : [2, {argsIgnorePattern: '^_', varsIgnorePattern: '^_'}],
    '@typescript-eslint/no-use-before-define'        : 0,
    '@typescript-eslint/prefer-reduce-type-parameter': 0,
    '@typescript-eslint/promise-function-async'      : 2,
    '@typescript-eslint/return-await'                : [2, 'always'],
    'no-return-await'                                : 0,
    'no-unused-expressions'                          : 0,
    'no-use-before-define'                           : 0,
};

const reactRules = {
    ...(eslintPluginReact.configs.flat.recommended?.rules ?? eslintPluginReact.configs.flat.recommended),
    ...(eslintPluginReact.configs.flat['jsx-runtime']?.rules ?? eslintPluginReact.configs.flat['jsx-runtime']),
    ...(eslintPluginReactHooks.configs.recommended?.rules ?? {}),
    ...(eslintPluginReactRefresh.configs.vite?.rules ?? {}),
    ...(eslintPluginQuery.configs['flat/recommended']?.rules ?? {}),
    ...(eslintPluginRouter.configs['flat/recommended']?.rules ?? {}),
    'jsx-quotes'                        : [2, 'prefer-single'],
    'react/jsx-closing-bracket-location': [2, 'line-aligned'],
    'react/jsx-curly-newline'           : [2, {multiline: 'consistent', singleline: 'consistent'}],
    'react/jsx-first-prop-new-line'     : [2, 'multiline'],
    'react/jsx-max-props-per-line'      : [2, {maximum: 1, when: 'always'}],
    'react/jsx-tag-spacing'             : [2,
        {
            afterOpening     : 'never',
            beforeClosing    : 'never',
            beforeSelfClosing: 'always',
        },
    ],
};

export default [
    {
        files          : ['**/*.js', '**/*.mjs'],
        ignores        : ['dist/**', 'node_modules/**'],
        languageOptions: {
            globals      : {...globals.node, ...globals.es2021, ...globals.browser},
            parserOptions: {ecmaVersion: 'latest', sourceType: 'module'},
        },
        plugins: {
            '@stylistic'      : stylistic,
            '@tanstack/query' : eslintPluginQuery,
            '@tanstack/router': eslintPluginRouter,
            import            : eslintPluginImport,
            perfectionist     : eslintPluginPerfectionist,
            react             : eslintPluginReact,
            'react-hooks'     : eslintPluginReactHooks,
            'react-refresh'   : eslintPluginReactRefresh,
        },
        rules   : {...commonRules, ...reactRules},
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
    {
        files          : ['**/*.ts', '**/*.tsx'],
        ignores        : ['dist/**', 'node_modules/**'],
        languageOptions: {
            globals      : {...globals.node, ...globals.es2021, ...globals.browser},
            parser,
            parserOptions: {
                ecmaFeatures   : {modules: true},
                ecmaVersion    : 'latest',
                project        : 'tsconfig.eslint.json',
                sourceType     : 'module',
                tsconfigRootDir: __dirname,
            },
        },
        plugins: {
            '@stylistic'        : stylistic,
            '@tanstack/query'   : eslintPluginQuery,
            '@tanstack/router'  : eslintPluginRouter,
            '@typescript-eslint': TypeScriptESLint,
            import              : eslintPluginImport,
            perfectionist       : eslintPluginPerfectionist,
            react               : eslintPluginReact,
            'react-hooks'       : eslintPluginReactHooks,
            'react-refresh'     : eslintPluginReactRefresh,
        },
        rules   : {...commonRules, ...typescriptRules, ...reactRules},
        settings: {
            react: {
                version: 'detect',
            },
        },
    },
];
