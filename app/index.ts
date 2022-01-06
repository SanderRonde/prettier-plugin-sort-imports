import { parsers as typescriptParsers } from 'prettier/parser-typescript';
import { sortBlockAlphabetically } from './sorters/alphabetical';
import { PrettierOptions, SORTING_TYPE } from './types';
import { sortBlockByLength } from './sorters/by-length';
import * as ts from 'typescript';

function countChar(str: string, char: string) {
	let count: number = 0;
	while (str.includes(char)) {
		count++;
		let index = str.indexOf(char);
		str = str.slice(0, index) + str.slice(index + 1);
	}
	return count;
}

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
				let startIndex: number = child.getStart();
				let endIndex: number = lastDeclaration.getEnd();
				const leadingComments = ts.getLeadingCommentRanges(
					file.getFullText(),
					child.getFullStart()
				);
				const trailingComments = ts.getTrailingCommentRanges(
					file.getFullText(),
					lastDeclaration.getEnd()
				);
				if (leadingComments && leadingComments.length) {
					// Has comments before it
					startIndex = leadingComments[0].pos;
				}
				if (trailingComments && trailingComments.length) {
					endIndex =
						trailingComments[trailingComments.length - 1].end;
				}
				if (
					countChar(
						file.getFullText().slice(endIndex, startIndex),
						'\n'
					) > 1
				) {
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

function sortBlock(
	block: ts.ImportDeclaration[],
	fullText: string,
	options: PrettierOptions
): string {
	const sorted =
		options.sortingMethod === SORTING_TYPE.ALPHABETICAL
			? sortBlockAlphabetically(block)
			: sortBlockByLength(block);

	for (let i = sorted.length - 1; i >= 0; i--) {
		if (sorted[i] !== block[i]) {
			const currentStatement = block[i];
			fullText =
				fullText.slice(0, currentStatement.getStart()) +
				sorted[i].getText() +
				fullText.slice(currentStatement.getEnd());
		}
	}

	return fullText;
}

/**
 * Organize the imports
 */
function sortImports(text: string, options: PrettierOptions) {
	if (
		text.includes('// sort-imports-ignore') ||
		text.includes('//sort-imports-ignore')
	) {
		return text;
	}

	const fileName = options.filepath || 'file.ts';

	const file = ts.createSourceFile(
		fileName,
		text,
		ts.ScriptTarget.Latest,
		true,
		fileName.endsWith('tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS
	);

	const blocks = findImportBlocks(file).reverse();
	for (const block of blocks) {
		text = sortBlock(block, text, options);
	}

	return text;
}

export const parsers = {
	typescript: {
		...typescriptParsers.typescript,
		preprocess: typescriptParsers.typescript.preprocess
			? (text: string, options: PrettierOptions) => {
					return sortImports(
						typescriptParsers.typescript.preprocess!(text, options),
						options
					);
			  }
			: sortImports,
	},
};

export const options = {
	sortingMethod: {
		since: '1.15.0',
		category: 'Global',
		type: 'choice',
		default: SORTING_TYPE.LINE_LENGTH,
		description: 'Which sorting method to use',
		choices: [
			{
				value: SORTING_TYPE.ALPHABETICAL,
				description: 'Sort imports alphabetically by the import path',
			},
			{
				value: SORTING_TYPE.LINE_LENGTH,
				description: 'Sort by line length, descending',
			},
		],
	},
};
