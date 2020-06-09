import {
  BaseTask,
  TaskMetaData,
  TaskResult,
  Task,
  Category,
  Priority,
  ESLintReport,
  Parser,
  TaskContext,
  ESLintOptions,
} from '@checkup/core';
import EslintSummaryTaskResult from '../results/eslint-summary-task-result';

import { readFileSync } from 'fs';
import { PackageJson } from 'type-fest';
import { resolve, join } from 'path';

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
  meta: TaskMetaData = {
    taskName: 'eslint-summary',
    friendlyTaskName: 'Eslint Summary',
    taskClassification: {
      category: Category.Insights,
      priority: Priority.Medium,
    },
  };

  private _eslintParser: Parser<ESLintReport>;
  jsPaths: string[];

  constructor(pluginName: string, context: TaskContext) {
    super(pluginName, context);

    let createEslintParser = this.context.parsers.get('eslint')!;

    let eslintConfig: ESLintOptions = readEslintConfig(
      this.context.paths,
      this.context.cliFlags.cwd,
      this.context.pkg
    );
    this._eslintParser = createEslintParser(eslintConfig);
    this.context.pkg;
    this.jsPaths = this.context.paths.filterByGlob('**/*.js');
  }

  async run(): Promise<TaskResult> {
    let result: EslintSummaryTaskResult = new EslintSummaryTaskResult(this.meta);

    let esLintReport = await this._runEsLint();
    this.debug('ESLint Report', esLintReport);
    result.esLintReport = esLintReport;

    return result;
  }

  private async _runEsLint(): Promise<ESLintReport> {
    return this._eslintParser.execute(this.jsPaths);
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
