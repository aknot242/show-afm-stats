const Client = require("node-rest-client-promise").Client;
const chalk = require("chalk");
const fs = require("fs");
let client = Object();

exports.initClient = (args) => {
    const protocol = "https://";
    client = getClient();

    // registering remote methods
    client.registerMethodPromise("authenticate", `${protocol}${args.bigIp}/mgmt/shared/authn/login`, "POST");
    client.registerMethodPromise("getAfmStats", `${protocol}${args.bigIp}/mgmt/tm/security/firewall/rule-stat`, "GET");
    client.registerMethodPromise("getDeviceStatus", `${protocol}${args.bigIp}/mgmt/tm/cm/device/`, "GET");
}

exports.getAuthToken = (username, password) => new Promise((resolve, reject) => {
    let body = {
        "username": username,
        "password": password,
        "loginProviderName": "tmos"
    }
    client.methods.authenticate(getBodyArgs(body))
        .then((tokenResult) => {
            const token = safeAccess(() => tokenResult.data.token.token, "");

            // make a secondary call to ensure authorization
            client.methods.getDeviceStatus(getDefaultArgs(token))
                .then((statusResult) => {
                    if (statusResult.response.statusCode === 401) {
                        reject(new Error("Authorization failed. Aborting."));
                    }
                    else {
                        resolve(token);
                    }
                });
        });
});

exports.getAfmStats = (token) => new Promise((resolve, reject) => {
    client.methods.getAfmStats(getDefaultArgs(token))
        .then((result) => {
            let data = safeAccess(() => result.data, new Array());
            resolve(data);
        })
        .catch((error) => reject(error));
});

exports.writeArrayToCsvFile = (array, fileName) => new Promise(function(resolve, reject) {

    // prepend array with csv header
    array.unshift('name,count');

    // write each value of the array on the file breaking line
    let data = array.join('\n');

    fs.writeFile(fileName, data, 'utf8', function(err) {
        if (err) reject(err);
        else resolve(data);
    });
});

exports.exitProcessWithFailStatus = (message) => {
    console.log(chalk.bgRed(message));
    process.exit(1);
}


// private functions

function getClient() {
    var options = {
        connection: {
            rejectUnauthorized: false
        }
    }
    return new Client(options);
}

function getBodyArgs(bodyData, token) {
    var args = getDefaultArgs(token);
    args["data"] = bodyData;
    return args;
}

function getDefaultArgs(token) {
    var args = {
        headers: {
            "Content-Type": "application/json"
        }
    };

    if (token !== undefined && token !== "") {
        args.headers["X-F5-Auth-Token"] = token;
    }
    return args;
}

function safeAccess(func, fallbackValue) {
    try {
        return func();
    }
    catch (e) {
        return fallbackValue;
    }
}
