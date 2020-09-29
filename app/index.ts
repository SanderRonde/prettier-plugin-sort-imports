import { parsers as typescriptParsers } from 'prettier/parser-typescript';
import { Options, ParserOptions } from 'prettier';
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

function sortBlock(block: ts.ImportDeclaration[], fullText: string): string {
	const sorted = [...block].sort((a, b) => {
		const aLength = a.getText().length;
		const bLength = b.getText().length;
		if (aLength === bLength && a.importClause && b.importClause) {
			return (
				b.importClause.getText().length -
				a.importClause.getText().length
			);
		}
		return bLength - aLength;
	});

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
function sortImports(text: string, options: Options) {
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
		ts.ScriptKind.TS
	);

	const blocks = findImportBlocks(file).reverse();
	for (const block of blocks) {
		text = sortBlock(block, text);
	}

	return text;
}

export const parsers = {
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
