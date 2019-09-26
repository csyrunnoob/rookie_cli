// 存放用户所需要的常量

const { version } = require('../package.json');
// 存储模版的位置
const DOWNLOAD_FILE_DIR = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.template`;
const configFile = `${process.env[process.platform === 'darwin' ? 'HOME' : 'USERPROFILE']}/.rookierc`;
const defaultConfig = {
  repo: 'rookie-cli', // 默认拉取的仓库名
};
module.exports = {
  version,
  DOWNLOAD_FILE_DIR,
  configFile,
  defaultConfig,
};
