export type RunOptions = {
  paths: string[];
  cwd: string;
  config?: string;
  categories?: string[];
  groups?: string[];
  tasks?: string[];
  excludePaths?: string[];
};

export default class CheckupTaskRunner {
  options: RunOptions;

  constructor(options: RunOptions) {
    this.options = options;
  }

  async run() {
    await new Promise((resolve) => {
      setTimeout(resolve, 2000);
    });

    // TEMPORARY: just returning this through right now for testing
    return this.options;
  }
}
