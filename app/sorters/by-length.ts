import { ImportBlock } from '..';
import { SORTING_ORDER } from '../types';

export function sortBlockByLength(
	declarations: ImportBlock,
	sortingOrder: string
): ImportBlock {
	return [...declarations].sort((a, b) => {
		let aLength = a.import.getText().length;
		let bLength = b.import.getText().length;
		if (aLength === bLength && a.importPath && b.importPath) {
			aLength = a.importPath.length;
			bLength = b.importPath.length;
		}
		return sortingOrder === SORTING_ORDER.ASCENDING
			? aLength - bLength
			: bLength - aLength;
	});
}
