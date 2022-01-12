import { ImportBlock } from '..';

export function sortBlockAlphabetically(
	declarations: ImportBlock
): ImportBlock {
	return [...declarations].sort((a, b) => {
		const aText = a.import.moduleSpecifier.getText();
		const bText = b.import.moduleSpecifier.getText();

		if (aText < bText) {
			return -1;
		} else if (aText > bText) {
			return 1;
		}
		return 0;
	});
}
