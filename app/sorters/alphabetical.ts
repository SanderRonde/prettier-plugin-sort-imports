import ts from 'typescript';

export function sortBlockAlphabetically(
	declarations: ts.ImportDeclaration[]
): ts.ImportDeclaration[] {
	return [...declarations].sort((a, b) => {
		const aText = a.moduleSpecifier.getText();
		const bText = b.moduleSpecifier.getText();

		if (aText < bText) {
			return -1;
		} else if (aText > bText) {
			return 1;
		}
		return 0;
	});
}
