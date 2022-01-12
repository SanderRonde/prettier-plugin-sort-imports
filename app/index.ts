import { parsers as typescriptParsers } from 'prettier/parser-typescript';
import { sortBlockAlphabetically } from './sorters/alphabetical';
import { PrettierOptions, SORTING_TYPE } from './types';
import { sortBlockByLength } from './sorters/by-length';
import * as ts from 'typescript';
import { ParserOptions } from 'prettier';

function countChar(str: string, char: string) {
	let count: number = 0;
	while (str.includes(char)) {
		count++;
		let index = str.indexOf(char);
		str = str.slice(0, index) + str.slice(index + 1);
	}
	return count;
}

type SingleImport = {
	import: ts.ImportDeclaration;
	start: number;
	end: number;
};

export type ImportBlock = SingleImport[];

function getLastTrailingComment(
	fullText: string,
	tsImport: ts.ImportDeclaration
) {
	const comments = ts.getTrailingCommentRanges(
		fullText,
		tsImport.getFullStart() + tsImport.getFullWidth()
	);
	if (!comments) {
		return null;
	}
	return comments[comments.length - 1];
}

function getFirstLeadingComment(
	fullText: string,
	tsImport: ts.ImportDeclaration
) {
	const comments = ts.getLeadingCommentRanges(
		fullText,
		tsImport.getFullStart()
	);
	if (!comments) {
		return null;
	}
	return comments[0];
}

function getImportRanges(
	blocks: ImportBlock[],
	fullText: string,
	tsImport: ts.ImportDeclaration
): SingleImport {
	const currentBlock = blocks[blocks.length - 1];
	const index = currentBlock.length;
	let start = index === 0 ? tsImport.getStart() : tsImport.getFullStart();
	if (index === 0 && tsImport.getFullStart() !== 0) {
		start--;
	}
	const leadingComment = getFirstLeadingComment(fullText, tsImport);
	if (leadingComment) {
		start = leadingComment.pos - 1;
	}

	const lastBlockChild = currentBlock[currentBlock.length - 1];
	const prevLastComment =
		lastBlockChild &&
		getLastTrailingComment(fullText, lastBlockChild.import);
	if (lastBlockChild && prevLastComment) {
		start =
			prevLastComment.end +
			~~(prevLastComment.hasTrailingNewLine ?? false);
	}
	let end = tsImport.getFullStart() + tsImport.getFullWidth();
	const lastComment = getLastTrailingComment(fullText, tsImport);
	if (lastComment) {
		end = lastComment.end;
		if (lastComment.hasTrailingNewLine) {
			end += 1;
		}
	}
	return {
		import: tsImport,
		start: Math.max(start, 0),
		end,
	};
}

// Find all "blocks" of imports. These are just lines of imports
// without any newlines between them
function findImportBlocks(
	file: ts.SourceFile,
	stripNewlines: boolean
): ImportBlock[] {
	const blocks: ImportBlock[] = [[]];
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
				const textBetween = file
					.getFullText()
					.slice(endIndex, startIndex);

				if (stripNewlines) {
					if (
						textBetween
							.split('')
							.filter(
								(c) => c !== '\n' && c !== '\t' && c !== ' '
							).length > 0
					) {
						// non-newlines in between, new block
						blocks.push([]);
					}
					// By just ignoring the newlines and not re-printing them
					// we're getting rid of them
				} else if (countChar(textBetween, '\n') > 1) {
					// New block
					blocks.push([]);
				}
			}
			blocks[blocks.length - 1].push(
				getImportRanges(blocks, file.getFullText(), child)
			);
			lastDeclaration = child;
		}
	}

	return blocks;
}

function transformLines(lines: string[], stripNewlines: boolean): string[] {
	return lines
		.map((b) => {
			if (!b.startsWith('\n')) {
				return `\n${b}`;
			}
			return b;
		})
		.map((b, i) => {
			if (stripNewlines && i !== 0) {
				while (b.startsWith('\n')) {
					b = b.slice(1);
				}
				return `\n${b}`;
			}
			return b;
		})
		.map((b) => {
			if (b.endsWith('\n')) {
				return b.slice(0, -1);
			}
			return b;
		});
}

function trimSpaces(line: string) {
	while (line.startsWith(' ') || line.startsWith('\t')) {
		line = line.slice(1);
	}
	while (line.endsWith(' ') || line.endsWith('\t')) {
		line = line.slice(0, -1);
	}
	return line;
}

function sortBlock(
	block: ImportBlock,
	fullText: string,
	options: PrettierOptions
): string {
	if (block.length === 0) {
		return fullText;
	}

	const sorted =
		options.sortingMethod === SORTING_TYPE.ALPHABETICAL
			? sortBlockAlphabetically(block)
			: sortBlockByLength(block);

	let blockText = transformLines(
		sorted.map((s) => trimSpaces(fullText.slice(s.start, s.end))),
		options.stripNewlines
	).join('');
	const lastBlock = block[block.length - 1];
	let lastBlockEnd =
		lastBlock.import.getFullStart() + lastBlock.import.getFullWidth();
	const trailingComments = ts.getTrailingCommentRanges(
		fullText,
		lastBlockEnd
	);
	if (trailingComments) {
		lastBlockEnd = trailingComments[trailingComments.length - 1].end;
		if (trailingComments[trailingComments.length - 1].hasTrailingNewLine) {
			lastBlockEnd += 1;
		}
	}
	if (block[0].import.getFullStart() === 0 && blockText.startsWith('\n')) {
		blockText = blockText.slice(1);
	}
	return (
		fullText.slice(0, block[0].start) +
		blockText +
		fullText.slice(lastBlock.end)
	);
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

	const blocks = findImportBlocks(file, options.stripNewlines).reverse();
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

export const options: {
	[K in keyof Omit<PrettierOptions, keyof ParserOptions>]: unknown;
} = {
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
	stripNewlines: {
		since: '1.15.0',
		category: 'Global',
		type: 'boolean',
		default: false,
		description:
			'Whether to strip newlines between blocks (joining blocks)',
	},
};
