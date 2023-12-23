import { ParserOptions } from 'prettier';

export enum SORTING_TYPE {
	LINE_LENGTH = 'lineLength',
	ALPHABETICAL = 'alphabetical',
}

export enum IMPORT_TYPE {
	NPM_PACKAGES = 'NPMPackages',
	VALUE = 'localImportsValue',
	TYPES = 'localImportsType',
	LOCAL_IMPORTS = 'localImports',
	ALL = 'all',
}

export interface PrettierOptions extends ParserOptions {
	sortingMethod: SORTING_TYPE;
	stripNewlines: boolean;
	importTypeOrder: IMPORT_TYPE[];
	packageJSONFiles: string[];
	newlineBetweenTypes: boolean;
}
