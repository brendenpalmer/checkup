import * as helpers from 'yeoman-test';

import { Answers } from 'inquirer';
import PluginGenerator from '../../src/generators/plugin';
import { createTmpDir } from '@checkup/test-helpers';
import { join } from 'path';

const DEFAULT_OPTIONS = {
  name: 'my-plugin',
  defaults: true,
};

const DEFAULT_PROMPTS = {
  typescript: true,
};

export async function generatePlugin(
  options: { [name: string]: any } = {},
  prompts: Answers = {},
  tmp: string = createTmpDir()
) {
  let mergedOptions = Object.assign({ path: '.' }, DEFAULT_OPTIONS, options);
  let mergedPrompts = Object.assign({}, DEFAULT_PROMPTS, prompts);
  let dir = await helpers
    .run(PluginGenerator, { namespace: 'checkup:plugin' })
    .cd(tmp)
    .withOptions(mergedOptions)
    .withPrompts(mergedPrompts);

  return options.path
    ? join(dir, options.path, `checkup-plugin-${mergedOptions.name}`)
    : join(dir, `checkup-plugin-${mergedOptions.name}`);
}
