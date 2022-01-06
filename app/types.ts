import { ParserOptions } from "prettier";

export enum SORTING_TYPE {
	LINE_LENGTH = 'lineLength',
	ALPHABETICAL = 'alphabetical'
}

export interface PrettierOptions extends ParserOptions {
	sortingMethod: SORTING_TYPE
}