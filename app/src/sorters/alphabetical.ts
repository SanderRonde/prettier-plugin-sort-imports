import { ImportBlock } from '..';

export function sortAlphabetically(a: string, b: string) {
	if (a < b) {
		return -1;
	} else if (a > b) {
		return 1;
	}
	return 0;
}

export function sortBlockAlphabetically(
	declarations: ImportBlock
): ImportBlock {
	return [...declarations].sort((a, b) => {
		const aText = a.importPath;
		const bText = b.importPath;

		return sortAlphabetically(aText, bText);
	});
}
