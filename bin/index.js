#!/usr/bin/env node
 // 处理用户输入的命令
const program = require("commander");
// 下载模板
const download = require("download-git-repo");
// 问题交互
const inquirer = require("inquirer");
// node 文件模块
const fs = require("fs");
// 填充信息至文件
const handlebars = require("handlebars");
// 动画效果
const ora = require("ora");
// 字体加颜色
const chalk = require("chalk");
// 显示提示图标
const symbols = require("log-symbols");
// 命令行操作
var shell = require("shelljs");
// 版本
const version = require("../package").version;
// 环境校验
const semver = require("semver");
// 文件删除
const rimraf = require("rimraf");

const requiredVersion = require("../package.json").engines.node;

function checkNodeVersion(wanted, id) {
    if (!semver.satisfies(process.version, wanted, {
            includePrerelease: true
        })) {
        console.log(
            chalk.red(
                "You are using Node " +
                process.version +
                ", but this version of " +
                id +
                " requires Node " +
                wanted +
                ".\nPlease upgrade your Node version."
            )
        );
        process.exit(1);
    }
}
checkNodeVersion(requiredVersion, "@vue/cli");
program
    .version(version, "-v, --version")
    .command("create <name>")
    .option("-f, --force", "Overwrite target directory if it exists")
    .option(
        "-r, --registry <url>",
        "Use specified npm registry when installing dependencies (only for npm)"
    )
    .description("create a new project powered by bc-cloud-cli")
    .action(async (name, options) => {
        const inCurrent = name === ".";
        if (fs.existsSync(name)) {
            if (options.force) {
                rimraf.sync(name);
            } else {
                if (inCurrent) {
                    const {
                        ok
                    } = await inquirer.prompt([{
                        name: "ok",
                        type: "confirm",
                        message: `Generate project in current directory?`
                    }]);
                    if (!ok) {
                        return;
                    }
                } else {
                    const {
                        action
                    } = await inquirer.prompt([{
                        name: "action",
                        type: "list",
                        message: `Target directory ${chalk.cyan(
                name
              )} already exists. Pick an action:`,
                        choices: [{
                                name: "Overwrite",
                                value: "overwrite"
                            },
                            // { name: 'Merge', value: 'merge' },
                            {
                                name: "Cancel",
                                value: false
                            }
                        ]
                    }]);
                    if (!action) {
                        return;
                    } else if (action === "overwrite") {
                        console.log(`\nRemoving ${chalk.cyan(name)}...`);
                        rimraf.sync(name);
                    }
                }
            }
        }
        inquirer
            .prompt([{
                    name: "description",
                    message: "Input the project description"
                },
                {
                    name: "author",
                    message: "Input the project author"
                }
            ])
            .then(answers => {
                const spinner = ora("Downloading...");
                spinner.start();
                download(
                    "Wshengs/ant-design-vue-template#main",
                    name, {
                        clone: !inCurrent
                    },
                    err => {
                        if (err) {
                            spinner.fail();
                            console.log(symbols.error, chalk.red(err));
                        } else {
                            spinner.succeed();
                            const fileName = `${name}/package.json`;
                            const indexHtml = `${name}/index.html`;
                            const helloworld = `${name}/src/pages/HelloWorld.vue`;
                            const app = `${name}/src/App.vue`;
                            const meta = {
                                name,
                                description: answers.description,
                                author: answers.author
                            };
                            [fileName, indexHtml, helloworld, app].forEach(item => {
                                replaceTemplate(item, meta);
                            });
                            initGit(name);
                            console.log(
                                symbols.success,
                                chalk.green("The vue object has downloaded successfully!")
                            );
                            inquirer
                                .prompt([{
                                    type: "confirm",
                                    name: "ifInstall",
                                    message: "Are you want to install dependence now?",
                                    default: true
                                }])
                                .then(answers => {
                                    if (answers.ifInstall) {
                                        inquirer
                                            .prompt([{
                                                type: "list",
                                                name: "installWay",
                                                message: "Choose the tool to install",
                                                choices: ["pnpm", "npm"]
                                            }])
                                            .then(ans => {
                                                installDependencies(
                                                    name,
                                                    ans.installWay,
                                                    options.registry
                                                ).then(done => {
                                                    if (!done) return;
                                                    runProject(name);
                                                });
                                            });
                                    } else {
                                        console.log(
                                            symbols.success,
                                            chalk.green(
                                                "You should install the dependence by yourself!"
                                            )
                                        );
                                    }
                                });
                        }
                    }
                );
            });
    });

function replaceTemplate(fileName, meta) {
    if (fs.existsSync(fileName)) {
        const content = fs.readFileSync(fileName).toString();
        const result = handlebars.compile(content)(meta);
        fs.writeFileSync(fileName, result);
    }
}

function installDependencies(directory, command, registry) {
    let spinner = ora("Installing...");
    spinner.start();
    return new Promise((resolve, reject) => {
        shell.exec(
            `cd ${directory} && ${command} install ${
        registry && command === "npm" ? `--registry ${registry}` : ""
      }`,
            function (err, stdout, stderr) {
                if (err) {
                    spinner.fail();
                    reject(false);
                    console.log(symbols.error, chalk.red(err));
                } else {
                    spinner.succeed();
                    resolve(true);
                    console.log(
                        symbols.success,
                        chalk.green("The object has installed dependence successfully!")
                    );
                }
            }
        );
    });
}

function runProject(directory) {
    return shell.exec(`cd ${directory} && npm run dev`, function (err) {
        if (err) {
            console.log(symbols.error, chalk.red("Project failed to start."));
        }
    });
}

function initGit(directory) {
    return shell.exec(`cd ${directory} && git init -q`, function (err) {
        if (err) {
            console.log(symbols.error, chalk.red("Init git failed."));
        }
    });
}
program.parse(process.argv);