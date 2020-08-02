import { getPluginName } from '@checkup/core';
import { CheckupProject, stdout, getTaskContext } from '@checkup/test-helpers';

import EslintDisableTask from '../src/tasks/eslint-disable-task';
import EslintDisableTaskResult from '../src/results/eslint-disable-task-result';

describe('eslint-disable-task', () => {
  let project: CheckupProject;
  let pluginName = getPluginName(__dirname);

  beforeEach(function () {
    project = new CheckupProject('foo', '0.0.0');
    project.files['index.js'] = `
    // eslint-disable-line no-eval
    /* eslint-disable */

    function foo(obj) { // adding this here because without babel parser, recast fails on this
      return {     // eslint-disable-line
        ...obj
      }
    }
    `;

    project.writeSync();
  });

  afterEach(function () {
    project.dispose();
  });

  it('returns all the types found in the app and outputs to the console', async () => {
    const result = await new EslintDisableTask(
      pluginName,
      getTaskContext({
        paths: project.filePaths,
        cliFlags: { cwd: project.baseDir },
      })
    ).run();
    const eslintDisableTaskResult = <EslintDisableTaskResult>result;

    eslintDisableTaskResult.toConsole();

    expect(stdout()).toMatchInlineSnapshot(`
      "eslint-disable Usages Found: 3
      "
    `);
  });

  it('returns all the types found in the app and outputs to json', async () => {
    const result = await new EslintDisableTask(
      pluginName,
      getTaskContext({
        paths: project.filePaths,
        cliFlags: { cwd: project.baseDir },
      })
    ).run();
    const eslintDisableTaskResult = <EslintDisableTaskResult>result;

    expect(eslintDisableTaskResult.toJson()).toMatchInlineSnapshot(`
      Object {
        "info": Object {
          "friendlyTaskName": "Number of eslint-disable Usages",
          "taskClassification": Object {
            "category": "linting",
          },
          "taskName": "eslint-disables",
        },
        "result": Array [
          Object {
            "count": 3,
            "data": Array [
              Object {
                "column": 4,
                "filePath": "/index.js",
                "line": 2,
                "message": "eslint-disable is not allowed",
                "ruleId": "no-eslint-disable",
              },
              Object {
                "column": 4,
                "filePath": "/index.js",
                "line": 3,
                "message": "eslint-disable is not allowed",
                "ruleId": "no-eslint-disable",
              },
              Object {
                "column": 19,
                "filePath": "/index.js",
                "line": 6,
                "message": "eslint-disable is not allowed",
                "ruleId": "no-eslint-disable",
              },
            ],
            "key": "eslint-disable",
            "type": "summary",
          },
        ],
      }
    `);
  });

  it('returns actions if there are more than 2 instances of eslint-disable', async () => {
    const result = await new EslintDisableTask(
      pluginName,
      getTaskContext({
        paths: project.filePaths,
        cliFlags: { cwd: project.baseDir },
      })
    ).run();

    const eslintDisableTaskResult = <EslintDisableTaskResult>result;
    expect(eslintDisableTaskResult.actions).toHaveLength(1);
    expect(eslintDisableTaskResult.actions[0]).toMatchInlineSnapshot(`
      Object {
        "defaultThreshold": 2,
        "details": "3 usages of template-lint-disable",
        "input": 3,
        "items": Array [
          "Total eslint-disable usages: 3",
        ],
        "name": "reduce-eslint-disable-usages",
        "summary": "Reduce number of eslint-disable usages",
      }
    `);
  });
});
