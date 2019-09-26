const axios = require('axios');
const ora = require('ora');
const Inquirer = require('inquirer');
const { promisify } = require('util');
const path = require('path');
let downloadGitRepo = require('download-git-repo');
let ncp = require('ncp');
const fs = require('fs');
const MetalSmith = require('metalsmith');// 遍历文件夹
let { render } = require('consolidate').ejs;
const { DOWNLOAD_FILE_DIR } = require('./constants');
const config = require('./config');

const repoUrl = config('getVal');
// 转成promise
render = promisify(render);
downloadGitRepo = promisify(downloadGitRepo);
ncp = promisify(ncp);
// 封装loading
const loadlingFn = (fn, msg) => async (...args) => {
  const loading = ora(msg);
  loading.start();
  const result = await fn(...args);
  loading.succeed();
  return result;
};
// 获取仓库下的项目列表
const fetchRepoList = async () => {
  const { data } = await axios.get('https://api.github.com/orgs/rookie-cli/repos');
  return data;
};
// 获取tag列表
const fetchTagList = async (repo) => {
  const { data } = await axios.get(`https://api.github.com/repos/rookie-cli/${repo}/tags`);
  return data;
};
// 下载到本地
const download = async (repo, tag) => {
  let path = `rookie-cli/${repo}`;
  if (tag) {
    path += `#${tag}`;
  }
  const dest = `${DOWNLOAD_FILE_DIR}/${repo}`;
  await downloadGitRepo(path, dest);
  return dest;// 下载的最终目录
};
module.exports = async (projectName) => {
  // console.log('repoUrl', repoUrl);
  let repos = await loadlingFn(fetchRepoList, 'fetching template ...')();
  repos = repos.map((item) => item.name);
  // 选择模版
  const { repo } = await Inquirer.prompt({
    name: 'repo', // 选择后的结果
    type: 'list',
    message: 'please choise a template to create your project',
    choices: repos,
  });
    // 选择项目后拉取对应版本
  let tags = await loadlingFn(fetchTagList, 'fetching tags ...')(repo);
  tags = tags.map((item) => item.name);
  const { tag } = await Inquirer.prompt({
    name: 'tag', // 选择后的结果
    type: 'list',
    message: 'please choise a project tag to create your project',
    choices: tags,
  });
  const downloadPath = await loadlingFn(download, 'download template ...')(repo, tag); // 最终路径
  // 拷贝文件 TODO:如果名字重复？

  // 如果简单模版直接拷贝 否则需要渲染
  if (!fs.existsSync(path.join(downloadPath, 'ask.js'))) {
    await ncp(downloadPath, path.resolve(projectName));
  } else {
    await new Promise((reslove, reject) => {
      MetalSmith(__dirname)
        .source(downloadPath)// 默认查找src下的文件
        .destination(path.resolve(projectName))
        .use(async (files, metal, done) => {
          const askArr = require(path.join(downloadPath, 'ask.js'));
          const result = await Inquirer.prompt(askArr);// 用户填写结果
          const meta = metal.metadata();
          Object.assign(meta, result);
          delete files['ask.js'];
          done();
        })
        .use((files, metal, done) => {
          Reflect.ownKeys(files).forEach(async (file) => {
            const userInputResult = metal.metadata();
            // 只处理 .js json文件
            if (file.includes('js') || file.includes('json')) {
              let content = files[file].contents.toString(); // 文件的内容
              if (content.includes('<%')) { // 判断是否是模版
                content = await render(content, userInputResult);
                files[file].contents = Buffer.from(content); // 渲染结果
              }
            }
          });
          // 根据用户输入下载模版
          // console.log(metal.metadata());
          done();
        })
        .build((error) => {
          if (error) {
            reject();
          } else {
            reslove();
          }
        });
    });
  }
};
