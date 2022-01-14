// 问题交互
const inquirer = require("inquirer");
// node 文件模块
const fs = require("fs");
// 字体加颜色
const chalk = require("chalk");
// 文件删除
const rimraf = require("rimraf");
const Creator = require("./Creator");
async function create( name, options){
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
    const creator = new Creator(name, options);
    creator.create();
}
module.exports = create