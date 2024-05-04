// @ts-expect-error Deprecated imports in prettier-3
import { parsers as typescriptParser } from 'prettier/parser-typescript';
// @ts-expect-error Deprecated imports in prettier-3
import { parsers as babelParser } from 'prettier/parser-babel';
import { getParsers } from './src';

export const parsers = getParsers({
	typescript: typescriptParser.typescript,
	babel: babelParser.babel,
});
export { options } from './src/options';
