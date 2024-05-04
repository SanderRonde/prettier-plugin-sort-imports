import { parsers as typescriptParser } from 'prettier/plugins/typescript';
import { parsers as babelParser } from 'prettier/plugins/babel';
import { getParsers } from './src';

export const parsers = getParsers({
	typescript: typescriptParser.typescript,
	babel: babelParser.babel,
});
export { options } from './src/options';
