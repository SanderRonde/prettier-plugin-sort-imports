import { parsers as typescriptParsers } from 'prettier/parser-typescript';
import { Options, ParserOptions } from 'prettier';
import * as ts from 'typescript';

// Find all "blocks" of imports. These are just lines of imports
// without any newlines between them
function findImportBlocks(file: ts.SourceFile) {
	const blocks: ts.ImportDeclaration[][] = [[]];
	const rootChildren =
		file.getChildren()[0].kind === ts.SyntaxKind.SyntaxList
			? file.getChildren()[0].getChildren()
			: file.getChildren();

	let lastDeclaration: ts.ImportDeclaration | null = null;
	for (const child of rootChildren) {
		if (ts.isImportDeclaration(child)) {
			if (lastDeclaration) {
				if (lastDeclaration.getEnd() + 1 !== child.getStart()) {
					// New block
					blocks.push([]);
				}
			}
			blocks[blocks.length - 1].push(child);
			lastDeclaration = child;
		}
	}

	return blocks;
}

function sortBlock(block: ts.ImportDeclaration[]) {
	// TODO:
}

/**
 * Organize the imports
 */
const sortImports = (text: string, options: Options) => {
	if (text.includes('// sort-imports-ignore')) {
		return text;
	}

	const fileName = options.filepath || 'file.ts';

	const file = ts.createSourceFile(
		fileName,
		text,
		ts.ScriptTarget.Latest,
		true,
		ts.ScriptKind.TS
	);
	const blocks = findImportBlocks(file);
	console.log(blocks);

	console.log('testing');
	return text;
};

/**
 * Apply the given set of changes to the text input.
 *
 * @param {string} input
 * @param {ts.TextChange[]} changes set of text changes
 */
const applyChanges = (input: string, changes: ts.TextChange[]) =>
	changes.reduceRight((text, change) => {
		const head = text.slice(0, change.span.start);
		const tail = text.slice(change.span.start + change.span.length);

		return `${head}${change.newText}${tail}`;
	}, input);

exports.parsers = {
	typescript: {
		...typescriptParsers.typescript,
		preprocess: typescriptParsers.typescript.preprocess
			? (text: string, options: ParserOptions) => {
					return sortImports(
						typescriptParsers.typescript.preprocess!(text, options),
						options
					);
			  }
			: sortImports,
	},
};
