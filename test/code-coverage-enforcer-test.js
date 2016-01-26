module.exports = (function (grunt) {
    "use strict";
    var util = require("../tasks/lib/code-coverage-enforcer-lib"),
        assert = require("chai").assert,
        sinon = require("sinon"),
        grunt = require("grunt"),
        filename = process.cwd() + "/test/lcov.info",
        homeDirectory = "/Users/hsomani/githubProjects/zionjs/lib",
        exports = {};

    exports.testNewLcovReader = function (test) {
        test.expect(2);
        util.parseLcov(filename, homeDirectory, function (err, data) {
            test.ok(!err, "No errors parsing the lcov file.");
            test.equal(Object.keys(data).length, 23, "The coverage data is found");
            test.done();
        });
    };

    exports.testCheckThresholdValidityWithAllFilesPassed = function (test) {
        var fileList = [
                "/Users/hsomani/githubProjects/zionjs/lib/configUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/cookieUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/HeaderUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/logger.js",
                "/Users/hsomani/githubProjects/zionjs/lib/processUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/response/errors.js",
                "/Users/hsomani/githubProjects/zionjs/lib/response/jsonformat.js",
                "/Users/hsomani/githubProjects/zionjs/lib/response/ResponseUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/response/ZionException.js",
                "/Users/hsomani/githubProjects/zionjs/lib/route/RouteBootstrap.js",
                "/Users/hsomani/githubProjects/zionjs/lib/route/RouteCreater.js",
                "/Users/hsomani/githubProjects/zionjs/lib/route/RouteParser.js",
                "/Users/hsomani/githubProjects/zionjs/lib/route/routeUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/securityUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/shutdown.js"
            ],
            failBuildThreshold = 50,
            configurations = [{
                "path": "cookieUtil.js",
                "lines": 50,
                "functions": 50,
                "branches": 50
            }, {
                "path": "HeaderUtil.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "logger.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "processUtil.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "response/errors.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "response/jsonformat.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "response/ResponseUtil.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "response/ZionException.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "route/RouteBootstrap.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "route/RouteCreater.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "route/RouteParser.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "route/routeUtil.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "securityUtil.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "shutdown.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }];
        test.expect(2);
        var collectStub = sinon.stub(util, "collect", function (fp, files, includes, excludes, replaceDirectory) {
            files.push(fp);
            return files;
        });
        var gruntLogOkSpy = sinon.spy(grunt.log, "ok");

        util.parseLcov(filename, homeDirectory, function (err, data) {
            var hasPassed = util.checkThresholdValidity(data, configurations, homeDirectory, false, failBuildThreshold);
            test.ok(hasPassed, "The coverage check has passed");
            test.equal(gruntLogOkSpy.callCount, 14, "All files passed");
            gruntLogOkSpy.restore();
            collectStub.restore();
            test.done();
        });
    };

    exports.testCheckThresholdValidityForFailedFiles = function (test) {
        var fileList = [
                "/Users/hsomani/githubProjects/zionjs/lib/configUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/cookieUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/HeaderUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/logger.js",
                "/Users/hsomani/githubProjects/zionjs/lib/processUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/response/errors.js",
                "/Users/hsomani/githubProjects/zionjs/lib/response/jsonformat.js",
                "/Users/hsomani/githubProjects/zionjs/lib/response/ResponseUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/response/ZionException.js",
                "/Users/hsomani/githubProjects/zionjs/lib/route/RouteBootstrap.js",
                "/Users/hsomani/githubProjects/zionjs/lib/route/RouteCreater.js",
                "/Users/hsomani/githubProjects/zionjs/lib/route/RouteParser.js",
                "/Users/hsomani/githubProjects/zionjs/lib/route/routeUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/securityUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/shutdown.js"
            ],
            failBuildThreshold = 50,
            configurations = [{
                "path": "cookieUtil.js",
                "lines": 100,
                "functions": 100,
                "branches": 100
            }, {
                "path": "HeaderUtil.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "logger.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "processUtil.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "response/errors.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "response/jsonformat.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "response/ResponseUtil.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "response/ZionException.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "route/RouteBootstrap.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "route/RouteCreater.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "route/RouteParser.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "route/routeUtil.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "securityUtil.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "shutdown.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }];
        test.expect(4);
        var collectStub = sinon.stub(util, "collect", function (fp, files, includes, excludes, replaceDirectory) {
            files.push(fp);
            return files;
        });
        var gruntLogOkSpy = sinon.spy(grunt.log, "ok");
        var gruntLogWarnSpy = sinon.spy(grunt.log, "warn");

        util.parseLcov(filename, homeDirectory, function (err, data) {
            var hasPassed = util.checkThresholdValidity(data, configurations, homeDirectory, false, failBuildThreshold);
            test.ok(!hasPassed, "Coverage dropped for files");
            test.equal(gruntLogOkSpy.callCount, 13, "13 files should pass");
            test.equal(gruntLogWarnSpy.callCount, 1, "1 file should fail");
            test.ok(gruntLogWarnSpy.calledWith("Failed: cookieUtil.js Actual: (79.31L, 75B, 66.67F) Expected: (100L, 100B, 100F)"), "Failed files found");
            gruntLogOkSpy.restore();
            gruntLogWarnSpy.restore();
            collectStub.restore();
            test.done();
        });
    };

    exports.testCheckThresholdValidityForFailedAndNeedsAttentionFiles = function (test) {
        var fileList = [
                "/Users/hsomani/githubProjects/zionjs/lib/configUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/cookieUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/HeaderUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/logger.js",
                "/Users/hsomani/githubProjects/zionjs/lib/processUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/response/errors.js",
                "/Users/hsomani/githubProjects/zionjs/lib/response/jsonformat.js",
                "/Users/hsomani/githubProjects/zionjs/lib/response/ResponseUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/response/ZionException.js",
                "/Users/hsomani/githubProjects/zionjs/lib/route/RouteBootstrap.js",
                "/Users/hsomani/githubProjects/zionjs/lib/route/RouteCreater.js",
                "/Users/hsomani/githubProjects/zionjs/lib/route/RouteParser.js",
                "/Users/hsomani/githubProjects/zionjs/lib/route/routeUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/securityUtil.js",
                "/Users/hsomani/githubProjects/zionjs/lib/shutdown.js"
            ],
            failBuildThreshold = 80,
            configurations = [{
                "path": "cookieUtil.js",
                "lines": 78,
                "functions": 100,
                "branches": 100
            }, {
                "path": "HeaderUtil.js",
                "lines": 90,
                "functions": 80,
                "branches": 80
            }, {
                "path": "logger.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "processUtil.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "response/errors.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "response/jsonformat.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "response/ResponseUtil.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "response/ZionException.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "route/RouteBootstrap.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "route/RouteCreater.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "route/RouteParser.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "route/routeUtil.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "securityUtil.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }, {
                "path": "shutdown.js",
                "lines": 20,
                "functions": 20,
                "branches": 20
            }];
        test.expect(5);
        var collectStub = sinon.stub(util, "collect", function (fp, files, includes, excludes, replaceDirectory) {
            files.push(fp);
            return files;
        });
        var gruntLogOkSpy = sinon.spy(grunt.log, "ok");
        var gruntLogWarnSpy = sinon.spy(grunt.log, "warn");

        util.parseLcov(filename, homeDirectory, function (err, data) {
            var hasPassed = util.checkThresholdValidity(data, configurations, homeDirectory, false, failBuildThreshold);
            test.ok(!hasPassed, "Coverage dropped for files");
            test.equal(gruntLogOkSpy.callCount, 12, "13 files should pass");
            test.equal(gruntLogWarnSpy.callCount, 2, "2 file should fail");
            test.ok(gruntLogWarnSpy.calledWith("Needs Attention: cookieUtil.js Actual: (79.31L, 75B, 66.67F) Expected: (78L, 100B, 100F)"), "Needs attention file found");
            test.ok(gruntLogWarnSpy.calledWith("Failed: HeaderUtil.js Actual: (100L, 75B, 100F) Expected: (90L, 80B, 80F)"), "Failed files found");
            gruntLogOkSpy.restore();
            gruntLogWarnSpy.restore();
            collectStub.restore();
            test.done();
        });
    };

    exports.testNormalizeSrcToObjWithNumericOverridesContainingZero = function (test) {
        test.expect(1);
        var functions = 20,
            branches = 20,
            lines = 20,
            includes = ["/**.js", "/**.js"],
            excludes = ["/**.js", "/**.js"],
            testValue = [{
                path: process.cwd().substring(1),
                lines: 0,
                functions: 0,
                branches: 0,
                includes: ["/**.js", "/**.js"],
                excludes: ["/**.js", "/**.js"]
            }],
            expectedValue = JSON.stringify(testValue),
            returnValue;

        returnValue = util.normalizeSrcToObj(testValue, lines, functions, branches, includes, excludes);

        test.strictEqual(JSON.stringify(returnValue), expectedValue, "Overrides provided in the config should be respected even if numeric values are 0.");

        test.done();
    };
    return exports;

}());