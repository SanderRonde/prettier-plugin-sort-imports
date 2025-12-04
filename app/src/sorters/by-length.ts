import { sortAlphabetically } from './alphabetical';
import { ImportBlock } from '..';

export function sortBlockByLength(declarations: ImportBlock): ImportBlock {
	const sorted = [...declarations].sort((a, b) => {
		let aLength = a.import.getText().length;
		let bLength = b.import.getText().length;
		if (aLength === bLength && a.importPath && b.importPath) {
			aLength = a.importPath.length;
			bLength = b.importPath.length;
		}
		// Always sort in descending order (larger values first)
		return (
			bLength - aLength || sortAlphabetically(b.importPath, a.importPath)
		);
	});

	return sorted;
}
