import { IMPORT_TYPE, PrettierOptions } from '../types';
import type { ImportBlock, SingleImport } from '..';
import ts from 'typescript';
import * as fs from 'fs';

function getNPMPackages(packageJSONFiles: string[]): string[] {
	const packages: string[] = [];
	for (const packageJSONFile of packageJSONFiles) {
		const packageText = fs.readFileSync(packageJSONFile, 'utf8');
		try {
			const packageJSON = JSON.parse(packageText);
			if (packageJSON.dependencies) {
				for (const packageName in packageJSON.dependencies) {
					packages.push(packageName);
				}
			}
		} catch (e) {
			console.warn('Failed to parse package.json file:', packageJSONFile);
		}
	}
	const uniquePackages = [...new Set(packages)];
	return uniquePackages;
}

function generateOrder(sorting: IMPORT_TYPE[], passOrder: IMPORT_TYPE[]) {
	const order: number[] = [];
	for (let i = 0; i < sorting.length; i++) {
		const type = sorting[i];
		if (passOrder.includes(type)) {
			order[i] = passOrder.indexOf(type);
		}
	}
	if (order.length !== sorting.length || order.length !== passOrder.length) {
		throw new Error(`Unknown import type specified`);
	}
	return order;
}

interface ConcatterGroup<V> {
	isGroup: true;
	values: V[][];
}

function generateOrderer<V>(order: number[]) {
	return (...values: (V[] | ConcatterGroup<V>)[]): V[][] => {
		let result: V[][] = [];
		for (const index of order) {
			const currentValue = values[index];
			if (!Array.isArray(currentValue)) {
				result.push(...currentValue.values);
			} else {
				result.push(currentValue);
			}
		}
		return result;
	};
}

export type ImportTypeSorter =
	| undefined
	| ((declarations: ImportBlock) => ImportBlock[]);

function isNPMPackage(
	npmPackages: string[],
	tsImport: ts.ImportDeclaration
): boolean {
	const importPath = tsImport.moduleSpecifier.getText();
	const importpathwithoutQuotes = importPath.slice(1, -1);
	const initialImportPath = importpathwithoutQuotes.includes('/')
		? importpathwithoutQuotes.split('/')[0]
		: importpathwithoutQuotes;
	return npmPackages.includes(initialImportPath);
}

function firstNonNegativeIndex(...indices: number[]): number {
	for (const index of indices) {
		if (index !== -1) {
			return index;
		}
	}
	return -1;
}

/**
 * Tries to generate a mostly-optimized function by limiting all
 * choices that can be made now to the outer scope.
 */
export function generateImportSorter({
	importTypeOrder,
	packageJSONFiles,
}: PrettierOptions): ImportTypeSorter {
	if (importTypeOrder.includes(IMPORT_TYPE.ALL)) {
		return undefined;
	}

	const npmPackages = getNPMPackages(packageJSONFiles);
	if (
		importTypeOrder.includes(IMPORT_TYPE.VALUE) ||
		importTypeOrder.includes(IMPORT_TYPE.TYPES)
	) {
		const npmPackagesFirst =
			importTypeOrder.indexOf(IMPORT_TYPE.NPM_PACKAGES) <
			firstNonNegativeIndex(
				importTypeOrder.indexOf(IMPORT_TYPE.LOCAL_IMPORTS),
				importTypeOrder.indexOf(IMPORT_TYPE.TYPES),
				importTypeOrder.indexOf(IMPORT_TYPE.VALUE)
			);
		const typeConcatter = generateOrderer<SingleImport>(
			npmPackagesFirst ? [1, 0] : [0, 1]
		);
		const concatter = generateOrderer<SingleImport>(
			generateOrder(importTypeOrder, [
				IMPORT_TYPE.VALUE,
				IMPORT_TYPE.TYPES,
				IMPORT_TYPE.NPM_PACKAGES,
			])
		);

		// Differentiate between type imports and value imports
		return (declarations: ImportBlock) => {
			const valueImports: SingleImport[] = [];
			const typeImports: SingleImport[] = [];
			const npmImports: SingleImport[] = [];
			const typeNpmImports: SingleImport[] = [];

			for (const singleImport of declarations) {
				const importIsNPMPackageImport = isNPMPackage(
					npmPackages,
					singleImport.import
				);
				if (singleImport.import.importClause?.isTypeOnly) {
					if (importIsNPMPackageImport) {
						typeNpmImports.push(singleImport);
					} else {
						typeImports.push(singleImport);
					}
				} else {
					if (importIsNPMPackageImport) {
						npmImports.push(singleImport);
					} else {
						valueImports.push(singleImport);
					}
				}
			}

			return concatter(
				valueImports,
				{
					isGroup: true,
					values: typeConcatter(typeImports, typeNpmImports),
				},
				npmImports
			);
		};
	}

	const concatter = generateOrderer<SingleImport>(
		generateOrder(importTypeOrder, [
			IMPORT_TYPE.NPM_PACKAGES,
			IMPORT_TYPE.LOCAL_IMPORTS,
		])
	);

	// Only differentiate between local imports and npm packages
	return (declarations: ImportBlock) => {
		const localImports: SingleImport[] = [];
		const npmImports: SingleImport[] = [];

		for (const singleImport of declarations) {
			if (isNPMPackage(npmPackages, singleImport.import)) {
				npmImports.push(singleImport);
			} else {
				localImports.push(singleImport);
			}
		}

		return concatter(npmImports, localImports);
	};
}
