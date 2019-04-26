const path = require(`path`);
const fs = require(`fs`);
const { exec } = require(`child_process`);
const chalk = require(`chalk`);
const os = require('os');
/**
 * 同步删除目录
 * @param {string} pathUrl is
 * @returns {boolean} is
 */
function deleteDirectorySync (pathUrl) {
    try {
        let files = [];
        if (fs.existsSync(pathUrl)) {
            // 读取该文件夹
            files = fs.readdirSync(pathUrl);
            for (const file of files) {
                const curPath = path.join(pathUrl, file);
                if (fs.statSync(curPath).isDirectory()) {
                    deleteDirectorySync(curPath);
                } else {
                    fs.unlinkSync(curPath);
                }
            }
            fs.rmdirSync(pathUrl);
        }
    } catch (e) {
        return false;
    }
    return true;
}

/**
 * 执行命令
 * @param cmdStr
 * @return {Promise<any>}
 */
function execFun ({ cmdStr, type = false }) {
    return new Promise(function (resolve, reject) {
        console.log(` command:`, chalk.blue(cmdStr.replace(/--password(.)*--force/, ($1) => { return `--password ****** --force` })));
        exec(cmdStr, {
            maxBuffer: 100 * 1024 * 1024
        }, (error, stdout, stderr) => {
            if (error && !type) {
                reject(error);
                return false;
            }
            resolve({
                error, stdout, stderr
            });
        });
    });
}

/**
 * 从git上面获取代码
 * @param gitUrl
 * @param projectName
 * @param branch
 * @return {Promise<any>}
 */
function getCodeFromGit ({ gitUrl, projectName, branch }) {
    return new Promise(function (resolve, reject) {
        // git命令，远程拉取项目并自定义项目名
        let cmdStr = `git clone ${gitUrl} ${projectName} && cd ${projectName} && git checkout ${branch}`;
        console.log(chalk.white(`\n Start pulling substitution codes from GIT...`));
        execFun({
            cmdStr
        }).then(() => {
            deleteDirectorySync(path.join(process.cwd(), `./${projectName}/.git`));
            console.log(chalk.green(`\n √ Successful Laplace Code from GIT!`));
            installDependencyPackage(projectName).then(() => {
                startProject(projectName)
                .then((res) => {
                    console.log(chalk.green(`\n √ server start success!`));
                    console.log(res);
                }).catch((err) => {
                    console.log(chalk.red(`\n × server start error`));
                    console.log(chalk.red(err));
                });
            })
            .catch((err) => {
                console.log(chalk.red(`\n × Failure to installDependencyPackage`));
                reject(err);
            });;
        }).catch((err) => {
            console.log(chalk.red(`\n × Failure to pull substitution code from GIT!`));
            reject(err);
        });
    });
}

function installDependencyPackage (projectName) {
    return new Promise(function (resolve, reject) {
        // 开执行 npm install 命令
        console.log(chalk.white(`\n Open and execute orders npm install...`));
        let cmdStr = ``;
        if (os.platform() === `linux`) {
            cmdStr = `cd ${projectName} && sudo npm install`;
        } else {
            cmdStr = `cd ${projectName} && npm install`;
        }
        execFun({
            cmdStr
        }).then(() => {
            console.log(chalk.green(`\n √ Install DependencyPackage Success!`));
            resolve();
        }).catch((err) => {
            console.log(chalk.red(`\n × Install DependencyPackage Failed!`));
            reject(err);
        });
    });
}

/**
 * 判断当前环境是否安装有pm2
 * @return {Promise<any>}
 */
function isExistPm2 () {
    return new Promise(function (resolve, reject) {
        // 判断是否全局的pm2命令
        console.log(chalk.white(`\n Determine whether the current environment is installed pm2...`));
        let cmdStr = ``;
        if (os.platform() === `linux`) {
            cmdStr = `sudo pm2 -v`;
        } else {
            cmdStr = `pm2 -v`;
        }
        execFun({
            cmdStr
        }).then((res) => {
            console.log(chalk.green(`\n √ The current environment has installed pm2!`));
            resolve(res.stdout);
        }).catch((err) => {
            console.log(chalk.green(`\n √ Current environment does not install pm2!`));
            reject(err);
        });
    });
}

/**
 * 安装pm2
 * @param dataSources
 * @return {Promise<any>}
 */
function installPm2 () {
    return new Promise(function (resolve, reject) {
        // 先判断当前系统是否已经安装有pm2
        isExistPm2().then((res) => {
            resolve(res);
        }).catch(() => {
            console.log(chalk.white(`\n Start Global Installation pm2...`));
            // 通过NPM下载
            console.log(chalk.white(`\n Open and execute orders npm install...`));
            // 开执行 npm install 命令
            let cmdStr = ``;
            if (os.platform() === `linux`) {
                cmdStr = `sudo npm install pm2 --g`;
            } else {
                cmdStr = `npm install pm2 --g`;
            }
            execFun({
                cmdStr
            }).then(() => {
                console.log(chalk.green(`\n √ Install pm2 Success!`));
                resolve();
            }).catch((err) => {
                console.log(chalk.red(`\n × Install pm2 Failed!`));
                reject(err);
            });
        });
    });
}

/**
 * 通过pm2启动项目
 * @return {Promise<any>}
 */
function execPm2 (projectName) {
    return new Promise(function (resolve, reject) {
        // 开始执行pm2命令
        console.log(chalk.white(`\n Start executing the PM2 command...`));

        // 先删除所有的pm2进程
        let cmdStr = ``;
        if (os.platform() === `linux`) {
            cmdStr = `sudo pm2 delete all`;
        } else {
            cmdStr = `pm2 delete all`;
        }
        execFun({
            cmdStr,
            type: true
        }).then((res) => {
            console.log(chalk.green(`\n √ pm2 delete all success!`));
            let cmdStr = ``;
            if (os.platform() === `linux`) {
                cmdStr = `cd ${projectName} && sudo pm2 start thrift.js`;
            } else {
                cmdStr = `cd ${projectName} && pm2 start thrift.js`;
            }
            return execFun({ cmdStr });
        }).then((res) => {
            console.log(chalk.green(`\n √ Successful start-up of the project by pm2!`));
            resolve(res.stdout);
        }).catch((err) => {
            reject(err);
        });
    });
}

/**
 * 启动项目
 * @return {Promise<any>}
 */
function startProject (projectName) {
    return new Promise(function (resolve, reject) {
        isExistPm2().then(() => {
            // 如果当前环境有安装pm2，则使用pm2启动项目
            execPm2(projectName).then((res) => {
                resolve(res);
            }).catch((err) => {
                reject(err);
            });
        }).catch(() => {
            installPm2().then(() => {
                execPm2(projectName).then((res) => {
                    resolve(res);
                }).catch((err) => {
                    reject(err);
                });
            }).catch((err) => {
                reject(err);
            })
        });
    });
}

module.exports = {
    getCodeFromGit,
    installDependencyPackage,
    startProject,
    deleteDirectorySync
};
