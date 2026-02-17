import {
	IMPORT_TYPE,
	PrettierOptions,
	SORTING_ORDER,
	SORTING_TYPE,
} from '../app/src/types';
import { ParserOptions } from 'prettier';
import * as path from 'path';
import test from 'ava';
const app = require(
	process.argv.includes('--dev') ? '../app/index' : '../dist/index'
) as {
	parsers: {
		typescript: {
			preprocess: (text: string, options: any) => string;
		};
	};
};
const transform: (
	text: string,
	options: Omit<PrettierOptions, keyof ParserOptions>
) => string = app.parsers.typescript.preprocess;

const defaultOptions: Omit<PrettierOptions, keyof ParserOptions> = {
	importTypeOrder: [IMPORT_TYPE.ALL],
	packageJSONFiles: ['package.json'],
	sortingMethod: SORTING_TYPE.LINE_LENGTH,
	sortingOrder: SORTING_ORDER.DESCENDING,
	stripNewlines: false,
	newlineBetweenTypes: false,
};

function createImports(
	imports: {
		statement: string;
		importPath: string;
	}[],
	useRequire: boolean = false
) {
	return (
		'\n\n\n' +
		imports
			.map((i) => {
				if (useRequire) {
					return `const ${i.statement} = require('${i.importPath}');`;
				}
				return `import { ${i.statement} } from '${i.importPath}';`;
			})
			.join('\n') +
		'\n'
	);
}

const CHARS =
	'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'.split('');
function genRandomString(length: number) {
	let str: string = '';
	for (let i = 0; i < length; i++) {
		str += CHARS[Math.floor(Math.random() * CHARS.length)];
	}
	return str;
}

function sortArr(
	imports: {
		statement: string;
		importPath: string;
	}[]
) {
	return [...imports].sort((a, b) => {
		const bLength = b.importPath.length + b.statement.length;
		const aLength = a.importPath.length + a.statement.length;
		if (aLength === bLength) {
			return b.statement.length - a.statement.length;
		}
		return bLength - aLength;
	});
}

function sortArrAlphabetically(
	imports: {
		statement: string;
		importPath: string;
	}[]
) {
	return [...imports].sort((a, b) => {
		if (a.importPath < b.importPath) {
			return -1;
		} else if (a.importPath > b.importPath) {
			return 1;
		}
		return 0;
	});
}

test('sorts a single block of imports by length', (t) => {
	const objArr = [
		{
			importPath: 'a',
			statement: 'a',
		},
		{
			importPath: 'ab',
			statement: 'ab',
		},
		{
			importPath: 'abc',
			statement: 'abc',
		},
		{
			importPath: 'abcd',
			statement: 'abcd',
		},
	];
	const input = createImports(objArr);
	const expected = createImports(sortArr(objArr));

	t.is(transform(input, defaultOptions), expected);
});
test('sorts a single block of imports by length in ascending order', (t) => {
	const objArr = [
		{
			importPath: 'a',
			statement: 'a',
		},
		{
			importPath: 'ab',
			statement: 'ab',
		},
		{
			importPath: 'abc',
			statement: 'abc',
		},
		{
			importPath: 'abcd',
			statement: 'abcd',
		},
	];
	const input = createImports(objArr);
	const expected = createImports(sortArr(objArr).reverse());

	t.is(
		transform(input, {
			...defaultOptions,
			sortingOrder: SORTING_ORDER.ASCENDING,
		}),
		expected
	);
});
test('sorts a single block of imports alphabetically', (t) => {
	const objArr = [
		{
			importPath: 'd',
			statement: 'a',
		},
		{
			importPath: 'c',
			statement: 'ab',
		},
		{
			importPath: 'a',
			statement: 'abc',
		},
		{
			importPath: 'b',
			statement: 'abcd',
		},
	];
	const input = createImports(objArr);
	const expected = createImports(sortArrAlphabetically(objArr));

	t.is(
		transform(input, {
			...defaultOptions,
			sortingMethod: SORTING_TYPE.ALPHABETICAL,
		}),
		expected
	);
});
test('sorts a single block of imports alphabetically in ascending order', (t) => {
	const objArr = [
		{
			importPath: 'd',
			statement: 'a',
		},
		{
			importPath: 'c',
			statement: 'ab',
		},
		{
			importPath: 'a',
			statement: 'abc',
		},
		{
			importPath: 'b',
			statement: 'abcd',
		},
	];
	const input = createImports(objArr);
	const expected = createImports(sortArrAlphabetically(objArr).reverse());

	t.is(
		transform(input, {
			...defaultOptions,
			sortingMethod: SORTING_TYPE.ALPHABETICAL,
			sortingOrder: SORTING_ORDER.ASCENDING,
		}),
		expected
	);
});
test('sorts multiple blocks', (t) => {
	const block1 = [
		{
			importPath: 'a',
			statement: 'a',
		},
		{
			importPath: 'ab',
			statement: 'ab',
		},
	];
	const block2 = [
		{
			importPath: 'abc',
			statement: 'abc',
		},
		{
			importPath: 'abcd',
			statement: 'abcd',
		},
	];
	const between = '\n\nfoo\nbar\n\n\n';
	const input = createImports(block1) + between + createImports(block2);
	const expected =
		createImports(sortArr(block1)) +
		between +
		createImports(sortArr(block2));

	t.is(transform(input, defaultOptions), expected);
});
test('strips newlines if that option is passed', (t) => {
	const block1 = [
		{
			importPath: 'a',
			statement: 'a',
		},
		{
			importPath: 'ab',
			statement: 'ab',
		},
	];
	const block2 = [
		{
			importPath: 'abc',
			statement: 'abc',
		},
		{
			importPath: 'abcd',
			statement: 'abcd',
		},
	];
	const between = '\n\n\n\n\n';
	const input = createImports(block1) + between + createImports(block2);
	const expected = createImports(sortArr([...block1, ...block2]));

	t.is(
		transform(input, { ...defaultOptions, stripNewlines: true }),
		expected
	);
});
test('does not join blocks if there is more than newlines between them', (t) => {
	const block1 = [
		{
			importPath: 'a',
			statement: 'a',
		},
		{
			importPath: 'ab',
			statement: 'ab',
		},
	];
	const block2 = [
		{
			importPath: 'abc',
			statement: 'abc',
		},
		{
			importPath: 'abcd',
			statement: 'abcd',
		},
	];
	const between = '\n\nfoo\nbar\n\n\n';
	const input = createImports(block1) + between + createImports(block2);
	const expected =
		createImports(sortArr(block1)) +
		between +
		createImports(sortArr(block2));

	t.is(
		transform(input, { ...defaultOptions, stripNewlines: true }),
		expected
	);
});
test('leaves the rest of the file alone', (t) => {
	const block1 = [
		{
			importPath: 'a',
			statement: 'a',
		},
		{
			importPath: 'ab',
			statement: 'ab',
		},
	];
	const block2 = [
		{
			importPath: 'abc',
			statement: 'abc',
		},
		{
			importPath: 'abcd',
			statement: 'abcd',
		},
	];
	const pre = genRandomString(100);
	const post = genRandomString(100);
	const between = genRandomString(100);
	const input =
		pre + createImports(block1) + between + createImports(block2) + post;
	const expected =
		pre +
		createImports(sortArr(block1)) +
		between +
		createImports(sortArr(block2)) +
		post;

	t.is(transform(input, defaultOptions), expected);
});
test('sorts by import length if full length is the same', (t) => {
	const objArr = [
		{
			importPath: 'a',
			statement: 'a',
		},
		{
			importPath: 'abc',
			statement: 'abcd',
		},
		{
			importPath: 'abc',
			statement: 'abcd',
		},
	];
	const input = createImports(objArr);
	const expected = createImports(sortArr(objArr));

	t.is(transform(input, defaultOptions), expected);
});
test('sorts same-length value and type imports from same path stably (lineLength ascending)', (t) => {
	const input = `import { useRef, useEffect } from "react";
import type { ReactElement } from "react";
`;
	const options = {
		...defaultOptions,
		sortingMethod: SORTING_TYPE.LINE_LENGTH,
		sortingOrder: SORTING_ORDER.ASCENDING,
		stripNewlines: true,
		importTypeOrder: [IMPORT_TYPE.ALL],
	};
	const expected = `import { useRef, useEffect } from "react";
import type { ReactElement } from "react";
`;
	const result = transform(input, options);
	t.is(result, expected);
	t.is(
		transform(result, options),
		result,
		'idempotent: second run yields same output'
	);
});
test('skips files containing the ignore string', (t) => {
	const objArr = [
		{
			importPath: 'a',
			statement: 'a',
		},
		{
			importPath: 'abc',
			statement: 'abcd',
		},
		{
			importPath: 'abc',
			statement: 'abcd',
		},
	];

	const input = '// sort-imports-ignore' + createImports(objArr);

	t.is(transform(input, defaultOptions), input);
});
test('comments above imports stick to that import', (t) => {
	const block = `import a from 'a';
import ab from 'ab';
// some comment here
import abc from 'abc';
import abcd from 'abcd';`;

	const blockExpected = `import abcd from 'abcd';
// some comment here
import abc from 'abc';
import ab from 'ab';
import a from 'a';`;

	t.is(transform(block, defaultOptions), blockExpected);
});
test('moves comments along if there are multiple blocks', (t) => {
	const block1 = [
		{
			importPath: 'a',
			statement: 'a',
		},
		{
			importPath: 'abc',
			statement: 'abcd',
		},
		{
			importPath: 'abc',
			statement: 'abcd',
		},
	];
	const block2 = `import a from 'a';
import ab from 'ab'; // some trailing comment here
import abc from 'abc';
// some comment here
import abcd from 'abcd';`;

	const block2Expected = `// some comment here
import abcd from 'abcd';
import abc from 'abc';
import ab from 'ab'; // some trailing comment here
import a from 'a';`;

	const input = createImports(block1) + '\n\n\n' + block2;

	const expected = createImports(sortArr(block1)) + '\n\n\n' + block2Expected;
	t.is(transform(input, defaultOptions), expected);
});
test('leaves other comments in the file alone', (t) => {
	const block1 = [
		{
			importPath: 'a',
			statement: 'a',
		},
		{
			importPath: 'abc',
			statement: 'abcd',
		},
		{
			importPath: 'abc',
			statement: 'abcd',
		},
	];
	const restOfFile = '\n\n\n\n\n// @ts-ignore\nconsole.warn("some code");';

	const input = createImports(block1) + restOfFile;

	const expected = createImports(sortArr(block1)) + restOfFile;

	t.is(transform(input, defaultOptions), expected);
});
test('does not introduce unneeded spacing', (t) => {
	const input = `import {} from 'a';
import {} from 'aa';
import {} from 'aaa';
import {} from 'aaaa';
console.warn('code between');
import {} from 'a';
import {} from 'aa';
import {} from 'aaa';
import {} from 'aaaa';

import {} from 'aaaaa';`;
	const expected = `import {} from 'aaaa';
import {} from 'aaa';
import {} from 'aa';
import {} from 'a';
console.warn('code between');
import {} from 'aaaaa';
import {} from 'aaaa';
import {} from 'aaa';
import {} from 'aa';
import {} from 'a';`;
	t.is(
		transform(input, { ...defaultOptions, stripNewlines: true }),
		expected
	);
});
test('can ignore blocks', (t) => {
	const input = `import {} from 'a';
import {} from 'aa';
// sort-imports-begin-ignore
import {} from 'bbb';
import {} from 'bbbb';
import {} from 'b';
// sort-imports-end-ignore
import {} from 'aa';
import {} from 'aaa';
import {} from 'aaaa';
import {} from 'aaaaa';`;
	const expected = `import {} from 'aa';
import {} from 'a';
// sort-imports-begin-ignore
import {} from 'bbb';
import {} from 'bbbb';
import {} from 'b';
// sort-imports-end-ignore
import {} from 'aaaaa';
import {} from 'aaaa';
import {} from 'aaa';
import {} from 'aa';`;
	t.is(transform(input, defaultOptions), expected);
});
test('leaves comments above the first import alone', (t) => {
	const input = `// Some comment
import {} from 'a';
import {} from 'aa';
import {} from 'aaa';
import {} from 'aaaa';
import {} from 'aaaaa';`;
	const expected = `// Some comment
import {} from 'aaaaa';
import {} from 'aaaa';
import {} from 'aaa';
import {} from 'aa';
import {} from 'a';`;
	t.is(transform(input, defaultOptions), expected);
});
test('sorts npm imports and local imports into different groups', (t) => {
	const input = `import {} from 'prettier';
import {} from 'aa';
import {} from 'aaa';
import {} from 'typescript';
import {} from 'aaaa';
import {} from 'aaaaaaaaaaaaa';`;
	const expected = `import {} from 'typescript';
import {} from 'prettier';
import {} from 'aaaaaaaaaaaaa';
import {} from 'aaaa';
import {} from 'aaa';
import {} from 'aa';`;
	t.is(
		transform(input, {
			...defaultOptions,
			packageJSONFiles: [
				path.join(__dirname, './resources/testPackage1.json'),
			],
			importTypeOrder: [
				IMPORT_TYPE.NPM_PACKAGES,
				IMPORT_TYPE.LOCAL_IMPORTS,
			],
		}),
		expected
	);
});
test('treats bun as builtin package', (t) => {
	const input = `import {} from 'aa';
import {} from 'bun';
import {} from 'aaa';
import {} from './local';`;
	const expected = `import {} from 'bun';
import {} from './local';
import {} from 'aaa';
import {} from 'aa';`;
	t.is(
		transform(input, {
			...defaultOptions,
			packageJSONFiles: [
				path.join(__dirname, './resources/testPackage1.json'),
			],
			importTypeOrder: [
				IMPORT_TYPE.NPM_PACKAGES,
				IMPORT_TYPE.LOCAL_IMPORTS,
			],
		}),
		expected
	);
});
test('sorts depending on passed order', (t) => {
	const input = `import {} from 'prettier';
import {} from 'aa';
import {} from 'aaa';
import {} from 'typescript';
import {} from 'aaaa';
import {} from 'aaaaaaaaaaaaa';`;
	const expected = `import {} from 'typescript';
import {} from 'prettier';
import {} from 'aaaaaaaaaaaaa';
import {} from 'aaaa';
import {} from 'aaa';
import {} from 'aa';`;
	t.is(
		transform(input, {
			...defaultOptions,
			packageJSONFiles: [
				path.join(__dirname, './resources/testPackage1.json'),
			],
			importTypeOrder: [
				IMPORT_TYPE.NPM_PACKAGES,
				IMPORT_TYPE.LOCAL_IMPORTS,
			],
		}),
		expected
	);
});
test('sorts npm imports, type imports and value imports into different groups', (t) => {
	const input = `import {} from 'prettier';
import {} from 'aa';
import type { ff } from 'aa';
import {} from 'aaa';
import {} from 'typescript';
import type { b } from 'aa';
import {} from 'aaaa';
import type {t} from 'typescript';
import {} from 'aaaaaaaaaaaaa';`;
	const expected = `import {} from 'typescript';
import {} from 'prettier';
import type {t} from 'typescript';
import type { ff } from 'aa';
import type { b } from 'aa';
import {} from 'aaaaaaaaaaaaa';
import {} from 'aaaa';
import {} from 'aaa';
import {} from 'aa';`;
	t.is(
		transform(input, {
			...defaultOptions,
			packageJSONFiles: [
				path.join(__dirname, './resources/testPackage1.json'),
			],
			importTypeOrder: [
				IMPORT_TYPE.NPM_PACKAGES,
				IMPORT_TYPE.TYPES,
				IMPORT_TYPE.VALUE,
			],
		}),
		expected
	);
});
test('allows specifying of multiple package json files', (t) => {
	const input = `import {} from 'prettier';
import {} from 'aa';
import {} from 'aaa';
import {} from 'typescript';
import {} from 'somePackage';
import {} from 'otherPackage';
import {} from 'aaaa';
import {} from 'aaaaaaaaaaaaa';`;
	const expected = `import {} from 'otherPackage';
import {} from 'somePackage';
import {} from 'typescript';
import {} from 'prettier';
import {} from 'aaaaaaaaaaaaa';
import {} from 'aaaa';
import {} from 'aaa';
import {} from 'aa';`;
	t.is(
		transform(input, {
			...defaultOptions,
			packageJSONFiles: [
				path.join(__dirname, './resources/testPackage1.json'),
				path.join(__dirname, './resources/testPackage2.json'),
			],
			importTypeOrder: [
				IMPORT_TYPE.NPM_PACKAGES,
				IMPORT_TYPE.LOCAL_IMPORTS,
			],
		}),
		expected
	);
});
test('can insert a newline between import types', (t) => {
	const input = `import {} from 'prettier';
import {} from 'aa';
import {} from 'aaa';
import {} from 'typescript';
import type {} from 'typescript';
import type {} from 'somePackage';
import {} from 'somePackage';
import {} from 'otherPackage';
import {} from 'aaaa';
import type {} from 'aaaa';
import {} from 'aaaaaaaaaaaaa';`;
	const expected = `import {} from 'otherPackage';
import {} from 'somePackage';
import {} from 'typescript';
import {} from 'prettier';

import {} from 'aaaaaaaaaaaaa';
import {} from 'aaaa';
import {} from 'aaa';
import {} from 'aa';

import type {} from 'somePackage';
import type {} from 'typescript';
import type {} from 'aaaa';`;
	t.is(
		transform(input, {
			...defaultOptions,
			packageJSONFiles: [
				path.join(__dirname, './resources/testPackage1.json'),
				path.join(__dirname, './resources/testPackage2.json'),
			],
			importTypeOrder: [
				IMPORT_TYPE.NPM_PACKAGES,
				IMPORT_TYPE.VALUE,
				IMPORT_TYPE.TYPES,
			],
			newlineBetweenTypes: true,
		}),
		expected
	);
});
test('can insert a newline between import types even when stripLines is enabled', (t) => {
	const input = `import {} from 'prettier';
import {} from 'aa';
import {} from 'aaa';



import {} from 'typescript';
import {} from 'somePackage';
import {} from 'otherPackage';



import {} from 'aaaa';
import {} from 'aaaaaaaaaaaaa';`;
	const expected = `import {} from 'otherPackage';
import {} from 'somePackage';
import {} from 'typescript';
import {} from 'prettier';

import {} from 'aaaaaaaaaaaaa';
import {} from 'aaaa';
import {} from 'aaa';
import {} from 'aa';`;
	t.is(
		transform(input, {
			...defaultOptions,
			packageJSONFiles: [
				path.join(__dirname, './resources/testPackage1.json'),
				path.join(__dirname, './resources/testPackage2.json'),
			],
			importTypeOrder: [
				IMPORT_TYPE.NPM_PACKAGES,
				IMPORT_TYPE.LOCAL_IMPORTS,
			],
			newlineBetweenTypes: true,
			stripNewlines: true,
		}),
		expected
	);
});
test('also supports requires', (t) => {
	const objArr = [
		{
			importPath: 'd',
			statement: 'a',
		},
		{
			importPath: 'c',
			statement: 'ab',
		},
		{
			importPath: 'a',
			statement: 'abc',
		},
		{
			importPath: 'b',
			statement: 'abcd',
		},
	];
	const input = createImports(objArr, true);
	const expected = createImports(sortArrAlphabetically(objArr), true);

	t.is(
		transform(input, {
			...defaultOptions,
			sortingMethod: SORTING_TYPE.ALPHABETICAL,
		}),
		expected
	);
});
test('should take dev dependencies into account', (t) => {
	const input = `import {} from 'prettier';
import {} from 'aa';
import {} from 'supertest';
import {} from 'aaa';
import {} from 'typescript';
import {} from 'aaaa';
import {} from 'ioredis';
import {} from 'aaaaaaaaaaaaa';`;
	const expected = `import {} from 'ioredis';
import {} from 'prettier';
import {} from 'supertest';
import {} from 'typescript';

import {} from 'aa';
import {} from 'aaa';
import {} from 'aaaa';
import {} from 'aaaaaaaaaaaaa';`;
	t.is(
		transform(input, {
			...defaultOptions,
			sortingMethod: SORTING_TYPE.ALPHABETICAL,
			packageJSONFiles: [
				path.join(
					__dirname,
					'./resources/testPackageWithDevDependencies.json'
				),
			],
			importTypeOrder: [
				IMPORT_TYPE.NPM_PACKAGES,
				IMPORT_TYPE.LOCAL_IMPORTS,
			],
			newlineBetweenTypes: true,
			stripNewlines: true,
		}),
		expected
	);
});
