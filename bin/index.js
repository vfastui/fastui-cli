#!/usr/bin/env node
// 处理用户输入的命令
const program = require("commander");
// 字体加颜色
const chalk = require("chalk");
// 版本
const version = require("../package").version;
// 环境校验
const semver = require("semver");
// node版本
const requiredVersion = require("../package.json").engines.node;

function checkNodeVersion(wanted, id) {
    if (
        !semver.satisfies(process.version, wanted, {
            includePrerelease: true
        })
    ) {
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
checkNodeVersion(requiredVersion, "vfastui-cli");
program
    .version(version, "-v, --version")
    .command("create <name>")
    .option("-f, --force", "Overwrite target directory if it exists")
    .option(
        "-r, --registry <url>",
        "Use specified npm registry when installing dependencies (only for npm)"
    )
    .description("create a new project powered by vfastui-cli")
    .action((name, options) => {
        require('../lib/create')(name, options);
    });
program.parse(process.argv);