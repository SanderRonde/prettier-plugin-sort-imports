import { ImportBlock, ImportBlockWithGroups, SingleImport } from '..';
import { IMPORT_TYPE, PrettierOptions } from '../types';
import { builtinModules } from 'module';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

function findPrettierConfig(filePath: string) {
	const isDirectory = (path: string): boolean => {
		try {
			const stat = fs.statSync(path);
			return stat.isDirectory();
		} catch (e) {
			if (e.code === 'ENOENT') {
				return false;
			}
			throw e;
		}
	};

	const dirs = (function* getGlobalDirs(): IterableIterator<string> {
		const stopDir = path.resolve(os.homedir());
		const startDir = path.dirname(path.resolve(filePath));
		yield startDir;
		let currentDir = startDir;
		while (currentDir !== stopDir) {
			const parentDir = path.dirname(currentDir);
			if (parentDir === currentDir) {
				break;
			}

			yield parentDir;
			currentDir = parentDir;
		}
	})();

	let currentDir = dirs.next();
	if (currentDir.done) {
		throw new Error();
	}

	for (const searchDir of dirs) {
		if (isDirectory(searchDir)) {
			for (const searchFile of [
				'.prettierrc',
				'.prettierrc.json',
				'.prettierrc.json5',
				'.prettierrc.yaml',
				'.prettierrc.yml',
				'.prettierrc.js',
				'.prettierrc.cjs',
				'.prettierrc.mjs',
				'prettier.config.js',
				'prettier.config.cjs',
				'prettier.config.mjs',
				'.prettierrc.toml',
			]) {
				const searchPath = path.join(searchDir, searchFile);
				if (fs.existsSync(searchPath)) {
					return searchPath;
				}
			}
		}
	}
	return null;
}

function getNPMPackages(
	formatFilePath: string,
	packageJSONFiles: string[]
): string[] {
	const packages: string[] = [];

	let rcFile: string | null | undefined = undefined;
	const procCwd = process.cwd();
	for (const packageJSONFile of packageJSONFiles) {
		const filePath = (() => {
			if (path.isAbsolute(packageJSONFile)) {
				return packageJSONFile;
			} else {
				const configFile = findPrettierConfig(formatFilePath);
				if (configFile) {
					rcFile = path.dirname(configFile);
				}

				const cwd = rcFile ?? procCwd;
				return path.join(cwd, packageJSONFile);
			}
		})();
		try {
			const packageText = fs.readFileSync(filePath, 'utf8');
			const packageJSON = JSON.parse(packageText);
			if (packageJSON.dependencies) {
				for (const packageName in packageJSON.dependencies) {
					packages.push(packageName);
				}
			}
			if (packageJSON.devDependencies) {
				for (const packageName in packageJSON.devDependencies) {
					packages.push(packageName);
				}
			}
		} catch (e) {
			console.warn('Failed to read/parse package.json file:', filePath);
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

export class OrderGroup<V> {
	constructor(public values: V[]) {}
}

function generateOrderer<V>(order: number[]) {
	return (...values: (V | OrderGroup<V>)[]): (V | OrderGroup<V>)[] => {
		let result: (V | OrderGroup<V>)[] = [];
		for (const index of order) {
			const value = values[index];
			result.push(value);
		}
		return result;
	};
}

export type ImportTypeSorter =
	| undefined
	| ((declarations: ImportBlock) => ImportBlockWithGroups);

const builtinNodeModules = builtinModules.filter((m) => !m.startsWith('_'));
function isNPMPackage(npmPackages: string[], importPath: string): boolean {
	const importpathwithoutQuotes = importPath.slice(1, -1);
	return [...npmPackages, ...builtinNodeModules].some((npmPackage) =>
		importpathwithoutQuotes.startsWith(npmPackage)
	);
}

function firstIndex(...incides: number[]) {
	for (const index of incides) {
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
	filepath,
}: PrettierOptions): ImportTypeSorter {
	if (importTypeOrder.includes(IMPORT_TYPE.ALL)) {
		return undefined;
	}

	const npmPackages = getNPMPackages(filepath, packageJSONFiles);
	if (
		importTypeOrder.includes(IMPORT_TYPE.VALUE) ||
		importTypeOrder.includes(IMPORT_TYPE.TYPES)
	) {
		const concatter = generateOrderer<SingleImport[]>(
			generateOrder(importTypeOrder, [
				IMPORT_TYPE.VALUE,
				IMPORT_TYPE.TYPES,
				IMPORT_TYPE.NPM_PACKAGES,
			])
		);
		const npmImportsFirst =
			importTypeOrder.indexOf(IMPORT_TYPE.NPM_PACKAGES) <
			firstIndex(
				importTypeOrder.indexOf(IMPORT_TYPE.VALUE),
				importTypeOrder.indexOf(IMPORT_TYPE.LOCAL_IMPORTS)
			);
		const typeImportSorter = generateOrderer<SingleImport[]>(
			npmImportsFirst ? [0, 1] : [1, 0]
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
					singleImport.importPath
				);
				if (singleImport.isTypeOnly) {
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
				new OrderGroup(
					typeImportSorter(
						typeNpmImports,
						typeImports
					) as SingleImport[][]
				),
				npmImports
			);
		};
	}

	const concatter = generateOrderer<SingleImport[]>(
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
			if (isNPMPackage(npmPackages, singleImport.importPath)) {
				npmImports.push(singleImport);
			} else {
				localImports.push(singleImport);
			}
		}

		return concatter(npmImports, localImports);
	};
}
