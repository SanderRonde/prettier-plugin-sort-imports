import { IMPORT_TYPE, PrettierOptions, SORTING_TYPE } from '../app/types';
import { ParserOptions } from 'prettier';
import * as fs from 'fs/promises';

const app = require('../app/index') as {
	parsers: {
		typescript: {
			preprocess: (text: string, options: any) => string;
		};
	};
};
const transform = app.parsers.typescript.preprocess;

async function main() {
	if (process.argv.length < 3) {
		console.error('Missing file to debug');
		process.exit(1);
	}

	const options: Omit<PrettierOptions, keyof ParserOptions> = {
		sortingMethod: SORTING_TYPE.LINE_LENGTH,
		stripNewlines: false,
		importTypeOrder: [IMPORT_TYPE.ALL],
		packageJSONFiles: ['package.json'],
		newlineBetweenTypes: false,
	};

	if (process.argv.includes('--sorting=alphabetical')) {
		options.sortingMethod = SORTING_TYPE.ALPHABETICAL;
	}
	if (process.argv.includes('--strip-newlines')) {
		options.stripNewlines = true;
	}

	console.log(
		transform(
			await fs.readFile(process.argv[2], { encoding: 'utf8' }),
			options
		)
	);
}

(async () => {
	await main();
})();
