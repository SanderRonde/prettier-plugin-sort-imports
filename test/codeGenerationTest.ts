import { ParserOptions } from 'prettier';
import * as fsSync from 'fs';
import * as fs from 'fs/promises';
import { IMPORT_TYPE, PrettierOptions, SORTING_TYPE } from '../app/types';
import * as path from 'path';

const app = require('../app/index') as {
	parsers: {
		typescript: {
			preprocess: (
				text: string,
				options: any,
				debugOptions?: { clearCache?: boolean }
			) => string;
		};
	};
};
const transform = app.parsers.typescript.preprocess;

namespace Constants {
	export const MIN_NUM_FILES = 10;
	export const MAX_NUM_FILES = 100;

	export const MIN_FILE_LENGTH = 100;
	export const MAX_FILE_LENGTH = 100;

	// These are all added together
	export const CHANCE_IMPORT = 2;
	export const CHANCE_CODE = 10;
	export const CHANCE_EMPTY_LINE = 1;
	export const CHANCE_COMMENT = 1;

	export const MIN_CODE_LENGTH = 5;
	export const MAX_CODE_LENGTH = 50;
	export const CODE_PERIOD_CHANCE = 0.05;

	export const CHANCE_BLOCK_COMMENT = 0.5;
	export const CHANCE_IMPORT_COMMENT = 0.2;

	export const LINE_MIN_LENGTH = 1;
	export const LINE_MAX_LENGTH = 100;

	export const CHANCE_STAR_IMPORT = 0.2;
	export const CHANCE_TYPE_IMPORT = 0.5;
	export const CHANCE_NPM_PACKAGE = 0.5;
	export const MIN_NUM_IMPORTS = 1;
	export const MAX_NUM_IMPORTS = 10;
	export const MIN_IMPORT_NAME_LENGTH = 1;
	export const MAX_IMPORT_NAME_LENGTH = 20;
	export const MIN_IMPORT_PATH_LENGTH = 1;
	export const MAX_IMPORT_PATH_LENGTH = 20;
}

namespace Util {
	export function randInt(min: number, max: number) {
		return Math.floor(Math.random() * (max - min + 1)) + min;
	}

	export function generateTextChar() {
		const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz';
		return alphabet[Math.floor(Math.random() * alphabet.length)];
	}

	export function randomString(length: number, extraChars: string[] = []) {
		let result = '';
		const characters =
			'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789' +
			extraChars.join('');
		const charactersLength = characters.length;
		for (let i = 0; i < length; i++) {
			result += characters.charAt(
				Math.floor(Math.random() * charactersLength)
			);
		}
		return result;
	}

	export function randomValidString(
		length: number,
		extraChars: string[] = []
	) {
		return generateTextChar() + randomString(length - 1, extraChars);
	}

	export function fiftyFifty() {
		return Math.random() >= 0.5;
	}

	export function randomItem<I>(items: I[]) {
		return items[Math.floor(Math.random() * items.length)];
	}

	export function shuffle<I>(items: I[]): I[] {
		const result = [...items];
		for (let i = result.length - 1; i > 0; i--) {
			const j = Math.floor(Math.random() * (i + 1));
			[result[i], result[j]] = [result[j], result[i]];
		}
		return result;
	}
}

namespace GenerateFile {
	namespace Lines {
		function generateImport(npmPackages: string[]) {
			const importNameClause = (() => {
				const isTypeImport =
					Math.random() < Constants.CHANCE_TYPE_IMPORT;
				const isStarImport =
					Math.random() < Constants.CHANCE_STAR_IMPORT;
				const importNameLength = Util.randInt(
					Constants.MIN_IMPORT_NAME_LENGTH,
					Constants.MAX_IMPORT_NAME_LENGTH
				);
				if (isStarImport) {
					return `import ${
						isTypeImport ? 'type ' : ''
					}* as ${Util.randomValidString(importNameLength)}`;
				}

				const numImports = Util.randInt(
					Constants.MIN_NUM_IMPORTS,
					Constants.MAX_NUM_IMPORTS
				);
				let str = `import ${isTypeImport ? 'type ' : ''}{`;
				for (let i = 0; i < numImports; i++) {
					const importNameLength = Util.randInt(
						Constants.MIN_IMPORT_NAME_LENGTH,
						Constants.MAX_IMPORT_NAME_LENGTH
					);
					str += `${Util.randomValidString(importNameLength)}, `;
					while (Math.random() < 0.2) {
						str += Util.fiftyFifty() ? '\n' : ' ';
					}
				}
				str += '}';
				return str;
			})();

			const importPath = (() => {
				const isNPMPackage =
					Math.random() < Constants.CHANCE_NPM_PACKAGE;
				if (isNPMPackage) {
					return npmPackages[Util.randInt(0, npmPackages.length - 1)];
				}
				const importPathLength = Util.randInt(
					Constants.MIN_IMPORT_PATH_LENGTH,
					Constants.MAX_IMPORT_PATH_LENGTH
				);
				return Util.randomValidString(importPathLength, ['.', '/']);
			})();

			let importStr = `${importNameClause} from '${importPath}'`;
			if (Util.fiftyFifty()) {
				importStr += ';';
			}

			if (Math.random() < Constants.CHANCE_IMPORT_COMMENT) {
				return importStr;
			}

			const commentLength = Util.randInt(
				Constants.LINE_MIN_LENGTH,
				Constants.LINE_MAX_LENGTH
			);
			importStr += `// ${Util.randomValidString(commentLength)}`;

			return importStr;
		}

		function generateCode() {
			const codeLength = Util.randInt(
				Constants.MIN_CODE_LENGTH,
				Constants.MAX_CODE_LENGTH
			);
			let code = Util.generateTextChar();
			for (let i = 1; i < codeLength; i++) {
				if (
					Math.random() < Constants.CODE_PERIOD_CHANCE &&
					code[code.length - 1] !== '.'
				) {
					code += '.';
					code += Util.generateTextChar();
					i++;
				}
				code += Util.randomString(1);
			}
			return code;
		}

		function generateEmptyLine() {
			return '';
		}

		function generateComment() {
			const commentLength = Util.randInt(
				Constants.LINE_MIN_LENGTH,
				Constants.LINE_MAX_LENGTH
			);
			if (Math.random() > Constants.CHANCE_BLOCK_COMMENT) {
				return (
					'/* ' +
					Util.randomValidString(commentLength, ['.', '\n', '\t']) +
					' */'
				);
			} else {
				return '//' + Util.randomValidString(commentLength);
			}
		}

		export function generateRandomLine(npmPackages: string[]): string {
			let typeNum = Util.randInt(
				0,
				Constants.CHANCE_IMPORT +
					Constants.CHANCE_CODE +
					Constants.CHANCE_EMPTY_LINE +
					Constants.CHANCE_COMMENT
			);
			if (typeNum < Constants.CHANCE_IMPORT) {
				return generateImport(npmPackages);
			}
			typeNum -= Constants.CHANCE_IMPORT;
			if (typeNum < Constants.CHANCE_CODE) {
				return generateCode();
			}
			typeNum -= Constants.CHANCE_CODE;
			if (typeNum < Constants.CHANCE_EMPTY_LINE) {
				return generateEmptyLine();
			}
			typeNum -= Constants.CHANCE_EMPTY_LINE;
			if (typeNum <= Constants.CHANCE_COMMENT) {
				return generateComment();
			}
			throw new Error('unreachable');
		}
	}

	export function generate(npmPackages: string[]) {
		const numLines = Util.randInt(
			Constants.MIN_FILE_LENGTH,
			Constants.MAX_FILE_LENGTH
		);
		const lines = [];
		for (let i = 0; i < numLines; i++) {
			lines.push(...Lines.generateRandomLine(npmPackages).split('\n'));
		}
		return lines.join('\n');
	}
}

namespace GenerateConfig {
	let packagePromise: Promise<{
		dependencies: string[];
		devDependencies: string[];
	}> | null = null;
	async function getPackageJson() {
		if (!packagePromise) {
			packagePromise = new Promise(async (resolve) => {
				const file = await fs.readFile(
					path.join(__dirname, '../', 'package.json'),
					{ encoding: 'utf-8' }
				);
				resolve(JSON.parse(file));
			});
		}
		return packagePromise;
	}

	function generateValidImportTypeOrder() {
		if (Util.fiftyFifty()) {
			return [IMPORT_TYPE.ALL];
		}

		const useSeparateLocalImports = Util.fiftyFifty();
		if (useSeparateLocalImports) {
			return Util.shuffle([
				IMPORT_TYPE.NPM_PACKAGES,
				IMPORT_TYPE.VALUE,
				IMPORT_TYPE.TYPES,
			]);
		} else {
			return Util.shuffle([
				IMPORT_TYPE.NPM_PACKAGES,
				IMPORT_TYPE.LOCAL_IMPORTS,
			]);
		}
	}

	async function generateOptions() {
		const options: Omit<PrettierOptions, keyof ParserOptions> = {
			stripNewlines: Util.fiftyFifty(),
			newlineBetweenTypes: Util.fiftyFifty(),
			sortingMethod: Util.randomItem([
				SORTING_TYPE.ALPHABETICAL,
				SORTING_TYPE.LINE_LENGTH,
			]),
			packageJSONFiles: ['package.json'],
			importTypeOrder: generateValidImportTypeOrder(),
		};
		const packageJson = await getPackageJson();
		const npmPackages = [
			...Object.keys(packageJson.dependencies),
			...Object.keys(packageJson.devDependencies),
		];

		return {
			options,
			npmPackages,
		};
	}

	export async function generateRun() {
		const { npmPackages, options } = await generateOptions();

		const numFiles = Util.randInt(
			Constants.MIN_NUM_FILES,
			Constants.MAX_NUM_FILES
		);
		const files = new Array(numFiles).fill('').map(() => {
			return GenerateFile.generate(npmPackages);
		});

		return {
			files,
			options,
		};
	}
}

namespace Runner {
	function runSingleFile(
		file: string,
		options: Omit<PrettierOptions, keyof ParserOptions>,
		clearCache?: boolean
	) {
		const result = transform(
			file,
			options,
			clearCache ? { clearCache: true } : undefined
		);
		const final = transform(result, options);
		if (result !== final) {
			fsSync.writeFileSync(
				path.join(__dirname, 'inconsistent.options.json'),
				JSON.stringify(options, null, '\t'),
				{
					encoding: 'utf8',
				}
			);
			fsSync.writeFileSync(
				path.join(__dirname, 'inconsistent.input.js'),
				file,
				{
					encoding: 'utf8',
				}
			);
			fsSync.writeFileSync(
				path.join(__dirname, 'inconsistent.output.js'),
				result,
				{
					encoding: 'utf8',
				}
			);
			fsSync.writeFileSync(
				path.join(__dirname, 'inconsistent.final.js'),
				final,
				{
					encoding: 'utf8',
				}
			);
			console.error(
				'Inconsistent result, wrote files to test/inconsistent.*.js'
			);
			process.exit(1);
		}
	}

	export function run(
		options: Omit<PrettierOptions, keyof ParserOptions>,
		files: string[]
	) {
		runSingleFile(files[0], options, true);
		for (let i = 1; i < files.length; i++) {
			runSingleFile(files[i], options, true);
		}

		return {
			files: files.length,
			lines: files.reduce((sum, file) => {
				return sum + file.split('\n').length;
			}, 0),
		};
	}
}

async function test() {
	let runs = 0;
	let files: number = 0;
	let lines: number = 0;
	while (true) {
		const config = await GenerateConfig.generateRun();
		const { lines: numLines, files: numFiles } = Runner.run(
			config.options,
			config.files
		);

		runs++;
		files += numFiles;
		lines += numLines;
		console.log(
			`Did ${runs} runs with a total of ${files} files for a total of ${lines} lines`
		);
	}
}

function getPath() {
	const args = process.argv.slice(2);
	for (const arg of args) {
		if (!arg.startsWith('--')) {
			return arg;
		}
	}
	return null;
}

async function singleRun() {
	const options = JSON.parse(
		await fs.readFile(path.join(__dirname, 'inconsistent.options.json'), {
			encoding: 'utf8',
		})
	) as Omit<PrettierOptions, keyof ParserOptions>;
	const input = await fs.readFile(
		getPath() ?? path.join(__dirname, 'inconsistent.input.js'),
		{
			encoding: 'utf8',
		}
	);
	const transformed = transform(input, options, { clearCache: true });
	await fs.writeFile(
		path.join(__dirname, 'inconsistent.singlerun.js'),
		transformed,
		{
			encoding: 'utf8',
		}
	);
}

async function main() {
	if (process.argv.includes('--test')) {
		await test();
	} else if (process.argv.includes('--run')) {
		await singleRun();
	} else {
		console.log('Usage: codeGenerationTest.ts [--test|--run]');
	}
}

(async () => {
	await main();
})();
