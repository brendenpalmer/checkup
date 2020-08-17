import {
  BaseTask,
  ESLintOptions,
  ESLintReport,
  Parser,
  Task,
  TaskContext,
  buildDerivedValueResult,
  buildLintResultData,
  bySeverity,
  TaskResult,
} from '@checkup/core';
import { join, resolve } from 'path';

import { PackageJson } from 'type-fest';
import { readFileSync } from 'fs';

/**
 * @export
 * @description In prioritized order as specified by https://eslint.org/docs/user-guide/configuring
 */
export const ACCEPTED_ESLINT_CONFIG_FILES = [
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.yaml',
  '.eslintrc.yml',
  '.eslintrc.json',
  '.eslintrc',
];

export class EslintSummaryTask extends BaseTask implements Task {
  taskName = 'eslint-summary';
  taskDisplayName = 'Eslint Summary';
  category = 'linting';

  private _eslintParser: Parser<ESLintReport>;

  constructor(pluginName: string, context: TaskContext) {
    super(pluginName, context);

    let createEslintParser = this.context.parsers.get('eslint')!;

    let eslintConfig: ESLintOptions = readEslintConfig(
      this.context.paths,
      this.context.cliFlags.cwd,
      this.context.pkg
    );
    this._eslintParser = createEslintParser(eslintConfig);
  }

  async run(): Promise<TaskResult> {
    let report = await this._eslintParser.execute(this.context.paths.filterByGlob('**/*.js'));
    let transformedData = buildLintResultData(report, this.context.cliFlags.cwd);

    let errorsResult = buildDerivedValueResult(
      'eslint-errors',
      bySeverity(transformedData, 2),
      'ruleId'
    );
    let warningsResult = buildDerivedValueResult(
      'eslint-warnings',
      bySeverity(transformedData, 1),
      'ruleId'
    );

    return this.toJson([errorsResult, warningsResult]);
  }
}

export function readEslintConfig(
  paths: string[],
  basePath: string,
  pkg: PackageJson
): ESLintOptions {
  let eslintConfigFile: string = '';

  for (const acceptedConfigFile of ACCEPTED_ESLINT_CONFIG_FILES) {
    let resolvedAcceptedConfigFile = join(resolve(basePath), acceptedConfigFile);

    if (paths.includes(resolvedAcceptedConfigFile)) {
      eslintConfigFile = readFileSync(resolvedAcceptedConfigFile, { encoding: 'utf8' });
      break;
    }
  }

  if (eslintConfigFile) {
    return eslintConfigFile as ESLintOptions;
  } else if (pkg.eslintConfig !== null) {
    return pkg.eslintConfig as ESLintOptions;
  } else {
    throw new Error(
      'No eslint config found in root (in the form of .eslintrc.* or as an eslintConfig field in package.json)'
    );
  }
}
