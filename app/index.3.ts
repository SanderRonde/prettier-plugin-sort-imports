import { parsers as typescriptParser } from 'prettier/plugins/typescript';
import { parsers as babelParser } from 'prettier/plugins/babel';
import { getParsers } from './src';

export const parsers = getParsers(
	typescriptParser.typescript,
	babelParser.babel
);
export { options } from './src/options';
