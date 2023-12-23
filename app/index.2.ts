// @ts-expect-error Deprecated imports in prettier-3
import { parsers as typescriptParser } from 'prettier/parser-typescript';
// @ts-expect-error Deprecated imports in prettier-3
import { parsers as babelParser } from 'prettier/parser-babel';
import { getParsers } from './src';

export const parsers = getParsers(
	typescriptParser.typescript,
	babelParser.babel
);
export { options } from './src/options';
