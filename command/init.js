`use strict`
const fs = require(`fs`);
const path = require(`path`);
const co = require(`co`);
const prompt = require(`co-prompt`);
const chalk = require(`chalk`);
const utils = require(`./utils`);
const os = require('os');
const getCodeFromGit = (gitUrl,projectName,branch) => {
    utils.getCodeFromGit({
        gitUrl,
        projectName,
        branch
    }).then(() => {
        console.log(chalk.green`\n √ richwaycanvas-cli init success!`);
        console.log(chalk.white(`\n Please execute the order npm install`));
        process.exit();
    }).catch((err) => {
        console.log(chalk.red(`\n × richwaycanvas-cli init error`));
        console.log(chalk.red(err));
        process.exit();
    });
}
// 初始化一个新项目
module.exports = (name = `drawCanvasServer`, branch = `master`) => {
    co(function* () {
        // 项目git地址
        let gitUrl = `https://github.com/FengDing1000/richway-draw--canvas-server.git`;
        let projectName = name;
        console.log(`\n The current system is ${os.platform()}`);
        console.log(chalk.white(`\n richwaycanvas-cli init start...`));
        if (fs.existsSync(path.resolve(process.cwd(), `./${projectName}`))) {
            utils.deleteDirectorySync(path.join(process.cwd(), `./${projectName}`));
            getCodeFromGit(gitUrl,projectName,branch);
        } else {
            getCodeFromGit(gitUrl,projectName,branch);
        }        
    });
}