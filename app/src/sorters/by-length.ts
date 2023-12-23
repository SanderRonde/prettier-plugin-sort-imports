import { ImportBlock } from '..';

export function sortBlockByLength(declarations: ImportBlock): ImportBlock {
	return [...declarations].sort((a, b) => {
		const aLength = a.import.getText().length;
		const bLength = b.import.getText().length;
		if (aLength === bLength && a.importPath && b.importPath) {
			return b.importPath.length - a.importPath.length;
		}
		return bLength - aLength;
	});
}
