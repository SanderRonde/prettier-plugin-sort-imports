import { ImportBlock } from '..';

export function sortBlockByLength(declarations: ImportBlock): ImportBlock {
	return [...declarations].sort((a, b) => {
		const aLength = a.import.getText().length;
		const bLength = b.import.getText().length;
		if (
			aLength === bLength &&
			a.import.importClause &&
			b.import.importClause
		) {
			return (
				b.import.importClause.getText().length -
				a.import.importClause.getText().length
			);
		}
		return bLength - aLength;
	});
}
