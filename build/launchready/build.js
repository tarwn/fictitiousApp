#!/usr/bin/env node
var minimist = require('minimist'),
    rp = require('request-promise'),
    Promise = require('bluebird'),
    promiseWhile = require('./utilities/promise'),
    fs = Promise.promisifyAll(require('fs'));

var argv = minimist(process.argv.slice(2));

if (argv.help) { 
    writeHelp();
    process.exit();
}

var missingOptions = [];
if (argv.appId == null)
    missingOptions.push('appId');
if (argv.apiKey == null)
    missingOptions.push('apiKey');
if (argv._.length == null)
    missingOptions.push('applicationId');
if (argv.name == null)
    missingOptions.push('name');


if (missingOptions.length > 0) { 
    writeHelp();
    console.error("Error: Missing required field(s): " + missingOptions.join(', '));
    process.exit(1);
}

function writeHelp() { 
    console.log("node build.js <applicationId> --appId=<appId> --apiKey=<apiKey> --name=<name> --baseURL=<baseURL> [optional params]");
    console.log("");
    console.log("Required Parameters:");
    console.log("   applicationId    LaunchReady application id to queue a test run for");
    console.log("   name             Name for this test run");
    console.log("   baseURL          BaseURL to test against");
    console.log("   appId            App ID for one of your LaunchReady API Keys");
    console.log("   apiKey           Corresponding LaunchReady API Key");
    console.log("");
    console.log("Optional Parameters:");
    console.log("   configs          JSON key/value application configs to override defaults");
    console.log("   pollDelay        Second delay between polling for status updates, default: 5s");
    console.log("   savePath         Save path for the JUnit.xml results file");
    console.log("   site             Internal option for testing script against staging/dev sites");
    console.log("   proxy            URL to direct traffic through (ex: http://127.0.0.1:8888 for fiddler)");
    console.log("");
}

var apiKey = argv.apiKey,
    appId = argv.appId,
    applicationId = argv._[0]
    testRunName = argv.name,
    baseURL = argv.baseURL;

var configs = JSON.parse(argv.configs || "{}"),
    savePath = argv.savePath || "launchready_junit.xml",
    site = argv.site || "http://app.launchready.co",
    pollDelay = argv.pollDelay || 5,
    proxy = argv.proxy;

var runConfigs = {
    baseURL: baseURL,
    configs: configs
};

try {
    run(apiKey, appId, applicationId, testRunName, runConfigs);
}
catch(err) {
    console.error(err);
    process.exit(2);
}

// ----------------------------- //

function requestNewTestRun(apiKey, appId, applicationId, testRunName, configs) { 
    log(1, 'POST: ' + site + '/api/public/v1/runs/start');
    return rp({
        method: 'POST',
        uri: site + '/api/public/v1/runs/start',
        qs: {
            applicationId: applicationId,
            testRunName: testRunName
        },
        headers: {
            'User-Agent': 'LaunchReadyScript-Node',
            'Accept': 'application/json',
            'Authorization': 'APIAuth ' + appId + ":" + apiKey,
            'Content-Type': 'application/json'
        },
        body: configs,
        json: true,
        proxy: proxy
    });    
}

function requestTestRunStatus(apiKey, appId, testRunId) { 
    return rp({
        uri: site + '/api/public/v1/runs/' + testRunId,
        headers: {
            'User-Agent': 'LaunchReadyScript-Node',
            'Accept': 'application/json',
            'Authorization': 'APIAuth ' + appId + ":" + apiKey
        },
        json: true,
        proxy: proxy
    });  
}

function requestJUnitResults(apiKey, appId, testRunId) { 
    return rp({
        uri: site + '/api/public/v1/runs/' + testRunId + '/results.xml',
        encoding: null,
        headers: {
            'User-Agent': 'LaunchReadyScript-Node',
            'Accept': 'application/json',
            'Authorization': 'APIAuth ' + appId + ":" + apiKey
        },
        proxy: proxy
    });  
}

if (!String.prototype.padEnd) {
    String.prototype.padEnd = function padEnd(targetLength,padString) {
        targetLength = targetLength>>0; //floor if number or convert non-number to 0;
        padString = String(padString || ' ');
        if (this.length > targetLength) {
            return String(this);
        }
        else {
            targetLength = targetLength-this.length;
            if (targetLength > padString.length) {
                padString += padString.repeat(targetLength/padString.length); //append to original to ensure we are longer than needed
            }
            return String(this) + padString.slice(0,targetLength);
        }
    };
}

function log(level, message) { 
    console.log(level.toString() + '  ' + (new Date()).getTime().toString() + '  ' + message);
}

function run(apiKey, appId, applicationId, testRunName, testRunConfigs) {
    log(1, "Starting test Run '" + testRunName + "' ApplicationId=" + applicationId + " via appId=" + appId);

    requestNewTestRun(apiKey, appId, applicationId, testRunName, testRunConfigs)
        .then(function (runStatus) {
            log(1, "Test Run started with id " + runStatus.runId + " and " + runStatus.testCaseStatsTotal + " test cases");

            var isComplete = runStatus.isComplete,
                isFailed = false,
                runId = runStatus.runId;
            
            function pollForStatus() {
                return Promise.delay(pollDelay * 1000)
                    .then(function () {
                        return requestTestRunStatus(apiKey, appId, runId)
                            .then(function (runStatus) {
                                isComplete = runStatus.isComplete;
                                status = "LR Status: " + runStatus.testCaseStatsPassed + " Pass, " + runStatus.testCaseStatsFailed + " Fail";
                                if (runStatus.testCaseStatsErrored > 0)
                                    status += ", " + runStatus.testCaseStatsErrored + " Error";
                                if (runStatus.testCaseStatsCancelled > 0)
                                    status += ", " + runStatus.testCaseStatsCancelled + " Cancel";
                                log(2, status);
                            })
                            .catch(function (err) {
                                isFailed = true;

                                log(1, "Error: " + err.message);
                                console.error(err);
                            });
                    });
            }

            promiseWhile(function () {
                return !(isComplete || isFailed); //add timeout                
            }, pollForStatus)
                .then(function () {
                    if (isFailed) {
                        process.exit(3);
                    }

                    log(1, "Downloading test run results as JUnit file");

                    return requestJUnitResults(apiKey, appId, runId, savePath)
                        .then(function (data) {
                            return fs.writeFileAsync(savePath, data);
                        })
                        .then(function () {
                            log(1, "LaunchReady Results Downloaded: " + savePath);
                        });
                });
        })
        .catch(function (err) {
            console.error(err);
            process.exit(4);
        });
}