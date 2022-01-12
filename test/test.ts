import test from 'ava';
const app = require('../dist/index') as {
	parsers: {
		typescript: {
			preprocess: (text: string, options: any) => string;
		};
	};
};
const transform = app.parsers.typescript.preprocess;

function createImports(
	imports: {
		statement: string;
		importPath: string;
	}[]
) {
	return (
		'\n\n\n' +
		imports
			.map((i) => {
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

	t.is(transform(input, {}), expected);
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

	t.is(transform(input, { sortingMethod: 'alphabetical' }), expected);
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

	t.is(transform(input, {}), expected);
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

	t.is(transform(input, { stripNewlines: true }), expected);
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

	t.is(transform(input, { stripNewlines: true }), expected);
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

	t.is(transform(input, {}), expected);
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

	t.is(transform(input, {}), expected);
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

	t.is(transform(input, {}), input);
});
test('comments above imports stick to that import', (t) => {
	const block = `// some comment here
import a from 'a';
import ab from 'ab'; 
import abc from 'abc';
import abcd from 'abcd';`;

	const blockExpected = `import abcd from 'abcd';
import abc from 'abc';
import ab from 'ab';
// some comment here
import a from 'a';`;

	t.is(transform(block, {}), blockExpected);
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
	const block2 = `// some comment here
import a from 'a';
import ab from 'ab'; // some trailing comment here
import abc from 'abc';	
import abcd from 'abcd';`;

	const block2Expected = `import abcd from 'abcd';
import abc from 'abc';
import ab from 'ab'; // some trailing comment here
// some comment here
import a from 'a';`;

	const input = createImports(block1) + '\n\n\n' + block2;

	const expected = createImports(sortArr(block1)) + '\n\n\n' + block2Expected;
	t.is(transform(input, {}), expected);
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
	const restOfFile = '\n\n\n\n\n// @ts-ignore\nconsole.log("some code");';

	const input = createImports(block1) + restOfFile;

	const expected = createImports(sortArr(block1)) + restOfFile;

	t.is(transform(input, {}), expected);
});
