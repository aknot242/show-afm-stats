const common = require("./common");
const chalk = require("chalk");
const jsonata = require("jsonata");

const argv = require("yargs")
    .usage("Usage: $0 --bigip [string] --username [string] --password [string] --outfile [string]")
    .demand(["bigip"])
    .example(
        "$0 --bigip bigip.example.com --username azureuser --password thisismypassword --outfile results.csv",
        "reports ASM rule stats from a BIG-IP to a CSV"
    ).argv;

var ARGS = {
    bigIp: argv.bigip,
    username: argv.username,
    password: argv.password,
    outfile: argv.outfile
};

if (ARGS.username === undefined || ARGS.password === undefined) common.exitProcessWithFailStatus(`Username or password not provided. Aborting.`);

common.initClient(ARGS);

common
    .getAuthToken(ARGS.username, ARGS.password)
    .then((token) => {
        console.log(`Auth token from ${ARGS.bigIp}: ${token}`);

        let getAfmStatsPromise = common.getAfmStats(token);

        getAfmStatsPromise.then((values) => {
            const expression = jsonata("entries.*.nestedStats.entries.(ruleName.description & ',' & counter.value)");
            const result = expression.evaluate(values);
            common.writeArrayToCsvFile(result, ARGS.outfile)
                .then(() => console.log(chalk.green("process complete")))
                .catch((error) => common.exitProcessWithFailStatus(error.message))
        });
    })
    .catch((error) => common.exitProcessWithFailStatus(error.message));
