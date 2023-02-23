import {
	IMPORT_TYPE,
	PrettierOptions,
	SORTING_TYPE,
	SORTING_ORDER,
} from './types';
import { ParserOptions } from 'prettier';

function validateImportTypeOrderOptions(
	options: PrettierOptions
): void | never {
	if (options.importTypeOrder.length === 0) {
		return;
	}
	if (options.importTypeOrder.includes(IMPORT_TYPE.ALL)) {
		if (options.importTypeOrder.length > 1) {
			throw new Error(
				`You cannot use the "${IMPORT_TYPE.ALL}" import type with other types.`
			);
		}
		return;
	}
	if (
		options.importTypeOrder.includes(IMPORT_TYPE.LOCAL_IMPORTS) &&
		(options.importTypeOrder.includes(IMPORT_TYPE.VALUE) ||
			options.importTypeOrder.includes(IMPORT_TYPE.TYPES))
	) {
		throw new Error(
			`You cannot use the "${IMPORT_TYPE.LOCAL_IMPORTS}" import type with other local import types. Choose between either using "${IMPORT_TYPE.LOCAL_IMPORTS}" (so all local imports) or specifying the order in which local imports are sorted by specifying both type and value options.`
		);
	}
	if (
		options.importTypeOrder.includes(IMPORT_TYPE.TYPES) !==
		options.importTypeOrder.includes(IMPORT_TYPE.VALUE)
	) {
		throw new Error(
			`You must specify both the "${IMPORT_TYPE.TYPES}" and "${IMPORT_TYPE.VALUE}" import types or use the "${IMPORT_TYPE.LOCAL_IMPORTS}" type that captures them both.`
		);
	}
	if (
		options.importTypeOrder.includes(IMPORT_TYPE.TYPES) ||
		options.importTypeOrder.includes(IMPORT_TYPE.VALUE) ||
		options.importTypeOrder.includes(IMPORT_TYPE.LOCAL_IMPORTS) ||
		options.importTypeOrder.includes(IMPORT_TYPE.NPM_PACKAGES)
	) {
		const hasLocalImportsOption =
			options.importTypeOrder.includes(IMPORT_TYPE.TYPES) ||
			options.importTypeOrder.includes(IMPORT_TYPE.VALUE) ||
			options.importTypeOrder.includes(IMPORT_TYPE.LOCAL_IMPORTS);
		if (
			hasLocalImportsOption !==
			options.importTypeOrder.includes(IMPORT_TYPE.NPM_PACKAGES)
		) {
			throw new Error(
				`You must specify one local-value import type (such as "${IMPORT_TYPE.LOCAL_IMPORTS}") and one npm-package import type (such as "${IMPORT_TYPE.NPM_PACKAGES}") or none at all.`
			);
		}
	}
}

export function validateOptions(options: PrettierOptions): void | never {
	validateImportTypeOrderOptions(options);
}

export const options: {
	[K in keyof Omit<PrettierOptions, keyof ParserOptions>]: unknown;
} = {
	sortingMethod: {
		since: '1.15.0',
		category: 'Global',
		type: 'choice',
		default: SORTING_TYPE.LINE_LENGTH,
		description: 'Which sorting method to use',
		choices: [
			{
				value: SORTING_TYPE.ALPHABETICAL,
				description: 'Sort imports alphabetically by the import path',
			},
			{
				value: SORTING_TYPE.LINE_LENGTH,
				description: 'Sort by line length, descending',
			},
		],
	},
	sortingOrder: {
		since: '1.15.0',
		category: 'Global',
		type: 'choice',
		default: SORTING_ORDER.DESCENDING,
		description: 'Which sorting order to use',
		choices: [
			{
				value: SORTING_ORDER.ASCENDING,
				description: 'Sort imports in ascending order',
			},
			{
				value: SORTING_ORDER.DESCENDING,
				description: 'Sort imports in descending order',
			},
		],
	},
	stripNewlines: {
		since: '1.15.0',
		category: 'Global',
		type: 'boolean',
		default: false,
		description:
			'Whether to strip newlines between blocks (joining blocks)',
	},
	importTypeOrder: {
		since: '1.15.0',
		category: 'Global',
		array: true,
		type: 'choice',
		default: [{ value: [IMPORT_TYPE.ALL] }],
		description:
			'Order in which to sort import types. Does not take import type into account by default.',
		choices: [
			{
				value: IMPORT_TYPE.NPM_PACKAGES,
				description:
					'NPM packages, inferred from your package.json file',
			},
			{
				value: IMPORT_TYPE.VALUE,
				description:
					'Value imports from within this project. Value imports are all non type-only imports',
			},
			{
				value: IMPORT_TYPE.TYPES,
				description:
					'Type imports from within this project. Only available in typescript.',
			},
			{
				value: IMPORT_TYPE.LOCAL_IMPORTS,
				description: `All imports from within this project. Cannot be used together with any of the other "${IMPORT_TYPE.LOCAL_IMPORTS}" options`,
			},
			{
				value: IMPORT_TYPE.ALL,
				description:
					'Every type of import. This is the default and means import type is not taken into account.',
			},
		],
	},
	packageJSONFiles: {
		since: '1.15.0',
		category: 'Global',
		array: true,
		type: 'string',
		default: [{ value: ['./package.json'] }],
		description:
			'Paths to package.json files relative to the .prettierrc.json file. These files will be used to infer NPM packages',
	},
	newlineBetweenTypes: {
		since: '1.15.0',
		category: 'Global',
		type: 'boolean',
		default: false,
		description:
			'Puts a newline between imports of different groups (see importTypeOrder)',
	},
};
