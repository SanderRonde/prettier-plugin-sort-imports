import { sortAlphabetically } from './alphabetical';
import { ImportBlock } from '..';
import { SORTING_ORDER } from '../types';

export function sortBlockByLength(
	declarations: ImportBlock,
	sortingOrder?: SORTING_ORDER
): ImportBlock {
	const sorted = [...declarations].sort((a, b) => {
		let aLength = a.import.getText().length;
		let bLength = b.import.getText().length;
		if (aLength === bLength && a.importPath && b.importPath) {
			aLength = a.importPath.length;
			bLength = b.importPath.length;
		}
		// Always sort in descending order (larger values first)
		const lengthDiff = bLength - aLength;
		if (lengthDiff !== 0) return lengthDiff;
		const pathCompare = sortAlphabetically(b.importPath, a.importPath);
		if (pathCompare !== 0) return pathCompare;
		// Same length and path: value imports before type imports for stable order
		// When ascending, caller reverses the list so we put type first here to get value first after reverse
		const typeCompare =
			sortingOrder === SORTING_ORDER.ASCENDING
				? (b.isTypeOnly ? 1 : 0) - (a.isTypeOnly ? 1 : 0)
				: (a.isTypeOnly ? 1 : 0) - (b.isTypeOnly ? 1 : 0);
		if (typeCompare !== 0) return typeCompare;
		// Ultimate tiebreaker: preserve original order
		return a.start - b.start;
	});

	return sorted;
}
