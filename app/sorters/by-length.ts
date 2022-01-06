import ts from 'typescript';

export function sortBlockByLength(
	declarations: ts.ImportDeclaration[]
): ts.ImportDeclaration[] {
	return [...declarations].sort((a, b) => {
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
}
