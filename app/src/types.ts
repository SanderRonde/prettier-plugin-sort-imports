import { ParserOptions } from 'prettier';

export enum SORTING_TYPE {
	LINE_LENGTH = 'lineLength',
	ALPHABETICAL = 'alphabetical',
}

export enum SORTING_ORDER {
	ASCENDING = 'ascending',
	DESCENDING = 'descending',
}

export enum IMPORT_TYPE {
	NPM_PACKAGES = 'NPMPackages',
	VALUE = 'localImportsValue',
	TYPES = 'localImportsType',
	LOCAL_IMPORTS = 'localImports',
	ALL = 'all',
}

export type PluginSortImportsOptions = {
	sortingMethod: SORTING_TYPE;
	sortingOrder: SORTING_ORDER;
	stripNewlines: boolean;
	importTypeOrder: IMPORT_TYPE[];
	packageJSONFiles: string[];
	newlineBetweenTypes: boolean;
};

export type PrettierOptions = ParserOptions & PluginSortImportsOptions;
