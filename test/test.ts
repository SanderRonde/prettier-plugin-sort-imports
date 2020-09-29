import test from 'ava';
const app = require('../app/index') as {
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

const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890'.split(
	''
);
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

test('sorts a single block of imports', (t) => {
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
test('leaves comments above imports alone', (t) => {
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

	const comment = '// some comment here';
	const input = comment + createImports(objArr);

	const expected = comment + createImports(sortArr(objArr));
	t.is(transform(input, {}), expected);
});
test('leaves comments alone when there are multiple blocks', (t) => {
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

	const block2Expected = `// some comment here
import abcd from 'abcd';
import abc from 'abc'; // some trailing comment here
import ab from 'ab';	
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
