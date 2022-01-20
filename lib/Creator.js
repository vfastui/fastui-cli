// 下载模板
const download = require("download-git-repo");
// 问题交互
const inquirer = require("inquirer");
// node 文件模块
const fs = require("fs");
// 填充信息至文件
const ejs = require("ejs");
// 动画效果
const ora = require("ora");
// 字体加颜色
const chalk = require("chalk");
// 显示提示图标
const symbols = require("log-symbols");
// 命令行操作
var shell = require("shelljs");
// ajax
const axios = require("axios");
// 路径解析
const { resolve } = require("path");
module.exports = class Creator {
    constructor(name, options) {
        this.inCurrent = name === ".";
        name = name === "." ? resolve("./").split("/").reverse()[0] : name;
        this.name = name;
        this.options = options;
    }
    getTemplateList(name, inCurrent) {
        const spinner = ora("Template downloading...");
        spinner.start();
        let url = "https://raw.githubusercontent.com/vfastui/template-list/main/template.json?v="+Math.random();
        return axios.get(url).then(async res => {
            if (res.status === 200) {
                spinner.succeed();
                let langList = Object.keys(res.data);
                let lang = await inquirer.prompt([{
                    type: "list",
                    name: "choiceLang",
                    message: "Choose the Lang",
                    choices: langList
                }]);
                let templateList = Object.keys(res.data[lang.choiceLang]);
                let templateName = await inquirer.prompt([{
                    type: "list",
                    name: "choiceTemplate",
                    message: "Choose the Template",
                    choices: templateList
                }]);
                return res.data[lang.choiceLang][templateName.choiceTemplate];
            } else {
                spinner.fail();
            }
        }).catch(err=>{
            spinner.fail();
            console.log(symbols.error, chalk.red("Download template failed!"));
        });
    }
    initGit(directory){
        return shell.exec(`cd ${directory} && git init -q`, function (err) {
            if (err) {
                console.log(symbols.error, chalk.red("Init git failed."));
            }
        });
    }
    replaceTemplate(fileName, meta) {
        if (fs.existsSync(fileName)) {
            const content = fs.readFileSync(fileName).toString();
            const result = ejs.compile(content)(meta);
            fs.writeFileSync(fileName, result);
        }
    }
    replaceFile(answers){
        const fileName = `${this.name}/package.json`;
        const indexHtml = `${this.name}/index.html`;
        const helloworld = `${this.name}/src/pages/HelloWorld.vue`;
        const app = `${this.name}/src/App.vue`;
        const meta = {
            name: this.name,
            description: answers.description,
            author: answers.author
        };
        [fileName, indexHtml, helloworld, app].forEach(item => {
            this.replaceTemplate(item, meta);
        });
        console.log(
            symbols.success,
            chalk.green("The vue object has downloaded successfully!")
        );
    }
    downloadTempAndCompile(templateUrl, answers, inCurrent){
        const spinner = ora("Downloading...");
        spinner.start();
        return new Promise((resolve,reject)=>{
            download(
                templateUrl,
                this.name, {
                    clone: !inCurrent
                },
                err => {
                    if (err) {
                        spinner.fail();
                        console.log(symbols.error, chalk.red(err));
                        reject(err);
                        process.exit(1);
                    } else {
                        spinner.succeed();
                        resolve()
                    }
                }
            );
        })
    }
    installDependencies(directory, command, registry) {
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
    runProject(directory) {
        return shell.exec(`cd ${directory} && npm run dev`, function (err) {
            if (err) {
                console.log(symbols.error, chalk.red("Project failed to start."));
            }
        });
    }
    async installPrompt(){
        const installInfo = await inquirer
            .prompt([{
                type: "confirm",
                name: "ifInstall",
                message: "Are you want to install dependence now?",
                default: true
            }])
        if (installInfo.ifInstall) {
            const ans = await inquirer
                .prompt([{
                    type: "list",
                    name: "installWay",
                    message: "Choose the tool to install",
                    choices: ["pnpm", "npm"]
                }])
            return await this.installDependencies(
                this.name,
                ans.installWay,
                this.options.registry
            )
        } else {
            console.log(
                symbols.success,
                chalk.green(
                    "You should install the dependence by yourself!"
                )
            );
        }
    }
    async create(){
        let templateUrl = await this.getTemplateList(this.name, this.inCurrent);
        if(!templateUrl) {
            process.exit(1);
        }
        const answers = await inquirer
            .prompt([{
                name: "description",
                message: "Input the project description"
            },
                {
                    name: "author",
                    message: "Input the project author"
                }
            ])
        await this.downloadTempAndCompile(templateUrl, answers, this.inCurrent);
        this.replaceFile(answers);
        // this.initGit(this.name);
        await this.installPrompt();
        // const isDone = await this.installPrompt();
        // isDone && this.runProject(this.name);
    }
}

