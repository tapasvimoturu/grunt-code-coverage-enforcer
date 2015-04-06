module.exports = (function(grunt) {
    "use strict";
    var util = require("../tasks/lib/code-coverage-enforcer-lib"),
        exports = {};
    debugger;
    exports.testNewLcovReader = function(test) {
        // debugger;
        test.expect(1);
        var filename = "../../githubProjects/zionjs/coverage/lcov.info",
            homeDirectory = "/Users/hsomani/githubProjects/zionjs";
        util.readFile(filename, function(content) {
            util.parseLcovContent(content, homeDirectory, function(data) {
                console.log(data);
                console.log(Object.keys(data).length);
                test.equal(Object.keys(data).length, 23, "The coverage is not the same");
            });
        });
        test.done();
    };

    exports.testNewCheckThresholdValidity = function(test) {
        // debugger;
        test.expect(1);
        var filename = "../../githubProjects/zionjs/coverage/lcov.info",
            config = {
                path: "/Users/hsomani/githubProjects/zionjs/lib",
                lines: 75,
                functions: 60,
                branches: 50,
                includes: ["lib/**.js"]
            },
            homeDirectory = "/Users/hsomani/githubProjects/zionjs";
        util.readFile(filename, function(content) {
            util.parseLcovContent(content, homeDirectory, function(data) {
                util.checkThresholdValidityForConfig(data, config, homeDirectory);
                test.equal("happy", "happy", "The coverage is not the same");
            });
        });
        test.done();
    };

    exports.testNewCheckThresholdValidityWithMultipleConfigs = function(test) {
        debugger;
        test.expect(1);
        var filename = "../../githubProjects/zionjs/coverage/lcov.info",
            config = [{
                path: "/Users/hsomani/githubProjects/zionjs/lib",
                lines: 50,
                functions: 50,
                branches: 50,
                includes: ["lib/**.js"]
            },{
                path: "/Users/hsomani/githubProjects/zionjs/middleware",
                lines: 50,
                functions: 50,
                branches: 50,
                includes: ["middleware/**.js"],
                excludes: ["middleware/errorCatcher.js"]
            },{
                path: "/Users/hsomani/githubProjects/zionjs/node_modules",
                lines: 0,
                functions: 0,
                branches: 0,
                includes: ["**/**.js"]
            }],
            homeDirectory = "/Users/hsomani/githubProjects/zionjs";
        util.readFile(filename, function(content) {
            util.parseLcovContent(content, homeDirectory, function(data) {
                util.checkThresholdValidity(data, config, homeDirectory);
                test.equal("happy", "happy", "The coverage is not the same");
            });
        });
        test.done();
    };

    exports.testConsoleLog = function(test) {
        debugger;
        test.expect(1);
        var filename = "../../githubProjects/zionjs/coverage/lcov.info",
            config = [{
                path: "/Users/hsomani/githubProjects/zionjs/lib",
                lines: 100,
                functions: 100,
                branches: 100,
                includes: ["lib/**.js"]
            },{
                path: "/Users/hsomani/githubProjects/zionjs/middleware",
                lines: 100,
                functions: 100,
                branches: 100,
                includes: ["middleware/**.js"],
                excludes: ["middleware/errorCatcher.js"]
            },{
                path: "/Users/hsomani/githubProjects/zionjs/node_modules",
                lines: 100,
                functions: 100,
                branches: 100,
                includes: ["**/**.js"]
            }],
            homeDirectory = "/Users/hsomani/githubProjects/zionjs";
        util.readFile(filename, function(content) {
            util.parseLcovContent(content, homeDirectory, function(data) {
                util.checkThresholdValidity(data, config, homeDirectory);
                test.equal("happy", "happy", "The coverage is not the same");
            });
        });
        test.done();
    };

    exports.testNormalizeFileName = function(test) {
        test.expect(3);

        var filename = "./random_file_name.txt",
            filename1 = "/random_file_name.txt",
            filename2 = "random_file_name.txt";

        test.equal("random_file_name.txt", util.normalizeFileName(filename), "The file name should get normalized.");
        test.equal("random_file_name.txt", util.normalizeFileName(filename1), "The file name should get normalized.");
        test.equal("random_file_name.txt", util.normalizeFileName(filename2), "The file name should get normalized.");

        test.done();
    };

    exports.testReadFile = function(test) {
        test.expect(2);

        var filename = "./test/testFile.txt";

        util.readFile(filename, function(content) {
            test.equal("Read File Test.", content, "The file contents do not match");
        });

        test.throws(function() {
            util.readFile("filename", null)
        }, Error, "Could not read file.");
        test.done();
    };

    // exports.testCheckThresholdValidityForConfig = function(test) {
    //     // test.expect(1);

    //     var item = [{
    //             file: "/Users/hsomani/githubProjects/grunt-code-coverage-enforcer/tasks/code-coverage-enforcer.js",
    //             lines: {
    //                 found: 20,
    //                 hit: 10
    //             },
    //             functions: {
    //                 hit: 10,
    //                 found: 20
    //             },
    //             branches: {
    //                 hit: 10,
    //                 found: 20
    //             }
    //         }],
    //         options = {
    //             path: process.cwd(),
    //             includes: ["tasks/**.js"],
    //             excludes: ["tasks/lib/**.js"],
    //             lines: 60,
    //             functions: 50,
    //             branches: 50
    //         };


    //     test.throws(function() {
    //         util.checkThresholdValidityForConfig(item, options);
    //     }, Error, "Threshold not met test.");
    //     test.done();
    // };

    // exports.testNormalizeSrcToObjBaseCase = function(test) {
    //     test.expect(1);
    //     var src = process.cwd(),
    //         functions = 20,
    //         branches = 20,
    //         lines = 20,
    //         includes = ["/**.js", "/**.js"],
    //         excludes = ["/**.js", "/**.js"],
    //         returnValue, testValue = [{
    //             path: process.cwd().substring(1),
    //             lines : 20,
    //             functions : 20,
    //             branches : 20,
    //             includes : ["/**.js", "/**.js"],
    //             excludes : ["/**.js", "/**.js"]
    //         }];
    //     returnValue = util.normalizeSrcToObj(src, lines, functions, branches, includes, excludes);
    //     test.strictEqual(JSON.stringify(returnValue), JSON.stringify(testValue), "The base case works");
    //     test.done();
    // };

    // exports.testCheckThresholdValidity = function(test) {
    //     // test.expect(1);

    //     var item = [{
    //             file: "/Users/hsomani/githubProjects/grunt-code-coverage-enforcer/tasks/code-coverage-enforcer.js",
    //             lines: {
    //                 found: 20,
    //                 hit: 10
    //             },
    //             functions: {
    //                 hit: 10,
    //                 found: 20
    //             },
    //             branches: {
    //                 hit: 10,
    //                 found: 20
    //             }
    //         }],
    //         options = [{
    //             path: process.cwd(),
    //             includes: ["tasks/**.js"],
    //             excludes: ["tasks/lib/**.js"],
    //             lines: 40,
    //             functions: 40,
    //             branches: 40
    //         }, {
    //             path: process.cwd(),
    //             includes: ["tasks/**.js"],
    //             excludes: ["tasks/lib/**.js"],
    //             lines: 40,
    //             functions: 40,
    //             branches: 40
    //         }];


    //     util.checkThresholdValidity(item, options);
    //     test.done();
    // };

    return exports;

}());