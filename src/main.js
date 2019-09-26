/* eslint-disable no-console */
// 核心文件
// 1）解析用户参数
const program = require('commander');
const path = require('path');
const { version } = require('./constants');

const mapCommands = {
  create: {
    alias: 'c',
    description: 'create a project',
    examples: [
      'rookie_cli create <your project-name>',
    ],
  },
  config: {
    alias: 'conf',
    description: 'config project variable',
    examples: [
      'rookie_cli config set <key> <value>',
      'rookie_cli config get <key> <value>',
    ],
  },
  '*': {
    alias: '',
    description: 'command not found',
    examples: [],
  },
};
Reflect.ownKeys(mapCommands).forEach((action) => {
  program.command(action)
    .alias(mapCommands[action].alias)
    .description(mapCommands[action].description)
    .action(() => {
      if (action === '*') {
        console.log(mapCommands[action].description);
      } else {
        // process.argv [node,rookie_cli,create,projectName]
        // console.log('参数', process.argv);
        require(path.resolve(__dirname, action))(...process.argv.slice(3));
      }
    });
});
// 监听help事件
program.on('--help', () => {
  console.log('Examples:');
  Reflect.ownKeys(mapCommands).forEach((action) => {
    mapCommands[action].examples.forEach((examples) => {
      console.log(`  ${examples}`);
    });
  });
});
program.version(version).parse(process.argv);
