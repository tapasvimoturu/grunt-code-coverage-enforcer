/**
 * Copyright 2014 Intuit Inc.
 * All rights reserved.
 *
 * Redistribution and use in source and binary forms, with or without
 * modification, are permitted provided that the following conditions are met:
 *    * Redistributions of source code must retain the above copyright
 *      notice, this list of conditions and the following disclaimer.
 *    * Redistributions in binary form must reproduce the above copyright
 *      notice, this list of conditions and the following disclaimer in the
 *      documentation and/or other materials provided with the distribution.
 *    * Neither the name of the Intuit! Inc. nor the
 *      names of its contributors may be used to endorse or promote products
 *      derived from this software without specific prior written permission.
 *
 * THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
 * ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
 * WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
 * DISCLAIMED. IN NO EVENT SHALL YAHOO! INC. BE LIABLE FOR ANY
 * DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
 * (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
 * LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
 * ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
 * (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
 * SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
 */


var fs = require("fs"),
    path = require("path"),
    stringify = require("json-stringify-safe"),
    shjs = require("shelljs"),
    minimatch = require("minimatch"),
    grunt = require("grunt");


module.exports = (function() {

    "use strict";

    // Add public functions to exports object to be used by the Grunt integration.
    var exports = {};

    /*
     * This method is a decorator used to normalize the file names that are created by LCOV reporters. For ex. Intern's default LCOV reporter
     * has the filename when it is in the current folder but Karma add as ./ in front of the file
     */
    exports.normalizeFileName = function(filename) {
        if (filename.substring(0, 2) === "./") {
            filename = filename.substring(2);
        } else if (filename.substring(0, 1) === "/") {
            filename = filename.substring(1);
        }
        return filename;
    };

    /**
     * This function is going to read the specified file synchronously and then call the provided callback with the string content.
     * @param  {string}   file     The filename to be read.
     * @param  {Function} callback The callback to be called on successful read.
     * @return {string}            The contents of the file in string format.
     */
    exports.readFile = function(file, callback) {
        grunt.verbose.writeln("Checking if file exists ... " + file);
        var content = fs.readFileSync(file, "utf8");
        if (content) {
            grunt.verbose.ok();
            callback(content);
        } else {
            grunt.fail.warn("Could not read from lcov file. Please ensure that that file exists");
        }
    };

    /**
     * This function reads the lcov string and converts it into a json object structure similar to the one below
     *
     */
    exports.parseLcovContent = function(lcovRawString, workingDirectory, callback) {
        //grunt.verbose.writeln("lcov content" + lcovRawString);
        var lcovData = {},
            item = exports.getEmptyLcovJsonEntry(),
            infoEntries = lcovRawString.split("\n");

        infoEntries.forEach(function(entry, index) {
            entry = entry.trim();
            var parts = entry.split(":"),
                lines, fn;
            switch (parts[0].toUpperCase()) {
                case "SF":
                    item.file = parts.slice(1).join(":").trim();
                    item.file = exports.normalizeOSPath(item.file);
                    break;
                case "FNF":
                    item.functions.found = Number(parts[1].trim());
                    break;
                case "FNH":
                    item.functions.hit = Number(parts[1].trim());
                    break;
                case "LF":
                    item.lines.found = Number(parts[1].trim());
                    break;
                case "LH":
                    item.lines.hit = Number(parts[1].trim());
                    break;
                case "BRF":
                    item.branches.found = Number(parts[1].trim());
                    break;
                case "BRH":
                    item.branches.hit = Number(parts[1].trim());
                    break;
            }

            if (entry.indexOf("end_of_record") > -1) {
                item.file = exports.normalizeFileName(item.file.replace(workingDirectory, ""));
                //Creating the lcov mapping between the file and the item.
                lcovData[item.file] = item;
                //lcovData.push(item);
                // Resetting item to a new Json object after pushing.
                item = exports.getEmptyLcovJsonEntry();
            }
        });
        grunt.verbose.writeln("processing callback with " + stringify(lcovData, null, 2));
        callback(lcovData);
    };

    /**
     * Helper method to create an empty Lcov json object.
     */
    exports.getEmptyLcovJsonEntry = function() {
        var item = {
            file: undefined,
            lines: {
                found: 0,
                hit: 0
            },
            functions: {
                hit: 0,
                found: 0
            },
            branches: {
                hit: 0,
                found: 0
            }
        };
        return item;
    }

    //normalizing all path properties.
    exports.normalizeOSPath = function(fp) {
        var arr = [],
            normalizeFile = function(f) {
                if (path.sep === "\\") {
                    //Current Machine is windows style
                    f = f.replace(/\//g, "\\");
                } else {
                    //Current Machine is unix style
                    f = f.replace(/\\/g, "/");

                }
                return f;
            };

        if (fp instanceof Array) {
            fp.forEach(function(file) {
                arr.push(normalizeFile(file));
            });
            return arr;
        } else {
            return normalizeFile(fp);
        }
    };

    /**
     * Recursively gather all files that need to be processed,
     * excluding those that user asked to ignore.
     *
     * @param {string} fp      a path to a file or directory to lint
     * @param {array}  files   a pointer to an array that stores a list of files
     * @param {array}  includes a list of patterns for files to match
     * @param {array}  excludes a list of patterns for files to ignore
     *
     * collect(options.src, fileList, options.includes, options.excludes, null);
     */
    exports.collect = function(fp, files, includes, excludes, replaceDirectory) {
        //grunt.verbose.writeln("trying to collect: " + fp +",filesLength:" + files.length +",includes:" + includes + ",excludes:"+excludes);
        //grunt.verbose.writeln("  testing for excludes");

        //grunt.verbose.writeln("  testing for directory");

        // if (!shjs.test("-e", fp)) {
        //     grunt.verbose.error("Can't open " + fp);
        //     return;
        // }

        if (shjs.test("-d", fp)) {
            shjs.find(fp).filter(function(file) {
                if (file.match(/\.js$/)) {
                    files.push(file);
                }
            });
        } else if (shjs.test("-f", fp) || shjs.test("-L", fp)) {
            files.push(fp);
        }

        files = files.filter(function(filename) {
            //grunt.verbose.writeln("  testing for files");
            if (includes && exports.isMatched(filename, replaceDirectory, includes)) {
                if (excludes && exports.isMatched(filename, replaceDirectory, excludes)) {
                    console.log("Excluded: " + filename);
                    // grunt.log.writeln("Excluded: " + filename);
                    return false;
                } else {
                    //the file should be included for checking threshold.
                }
            } else {
                return false;
            }
            // grunt.verbose.writeln("Included:" + filename);
            return true;
        });
        return files;
    };;

    /**
     * Checks whether a file matches the list of patterns specified.
     *
     * @param {string} fp       a path to a file
     * @param {array}  patterns a list of patterns for files  matching
     *
     * @return {boolean} "true" if file matches, "false" if file doesnt match.
     */
    exports.isMatched = function(fp, replaceDirectory, patterns) {
        //grunt.verbose.writeln("  checking for match with: " + ip);
        var file = path.resolve(fp).replace(replaceDirectory, "").trim();
        file = exports.normalizeFileName(file);

        if (patterns.indexOf(file) !== -1) {
            return true;
        }

        //grunt.verbose.writeln("Matching file:" + fp +" with pattern:" + patterns);
        return patterns.some(function(ip) {
            if (minimatch(file, ip, {
                    nocase: true
                })) {
                //grunt.verbose.writeln(file + ", Matched::file with regular expression");
                return true;
            }

            if (shjs.test("-d", fp) && ip.match(/^[^\/]*\/?$/) &&
                file.match(new RegExp("^" + ip))) {
                //grunt.verbose.writeln(fp+ ", Matched::regular expression:" + "^" + ip + "*" );
                return true;
            }

            //grunt.verbose.writeln(fp + ", Did not Match");
            return false;
        });
    };

    /**
     * This function checks if the source file that are included in the config object satisfies
     * the code coverage threshold specified in the configuration.
     *
     * @param  {Array} data  An array that contains the parsed contents of the lcov file.  See
     * @param  {config} data  Config for checking validity check for a specific folder.  See
     * @return {none}
     */
    exports.checkThresholdValidityForConfig = function(data, config, homeDirectory) {
        var src = config.path,
            lines = config.lines,
            functions = config.functions,
            branches = config.branches,
            includes = config.includes,
            excludes = config.excludes,
            pass = true,
            length = data.length,
            fileList = [];
        grunt.log.writeln("------------------------------------------------------------------");
        grunt.log.writeln("Running threshold checks for the following path config:" + config.path);
        grunt.verbose.writeln("Current config:" + JSON.stringify(config));
        grunt.log.writeln("------------------------------------------------------------------");
        grunt.log.writeln("------------------------------------------------------------------");
        grunt.log.writeln("Scanning folder for files");
        grunt.log.writeln("------------------------------------------------------------------");

        fileList = exports.collect(src, fileList, includes, excludes, homeDirectory);

        grunt.log.writeln("------------------------------------------------------------------");
        grunt.log.writeln("Threshold configuration: lines:" + lines + "%, functions:" + functions + "%, branches:" + branches + "%");
        grunt.log.writeln("------------------------------------------------------------------");

        fileList.forEach(function(filename, index) {
            var fName = exports.normalizeFileName(filename.replace(homeDirectory, ""));
            var fileData = data[fName];

            if (fileData) {
                var lineThreshold = 100,
                    functionThreshold = 100,
                    branchesThreshold = 100;
                if (fileData.lines.hit > 0) {
                    lineThreshold = fileData.lines.hit * 100 / fileData.lines.found;
                    lineThreshold = parseFloat(lineThreshold.toFixed(2));
                }

                if (fileData.functions.hit > 0) {
                    functionThreshold = fileData.functions.hit * 100 / fileData.functions.found;
                    functionThreshold = parseFloat(functionThreshold.toFixed(2));
                }

                if (fileData.branches.hit > 0) {
                    branchesThreshold = fileData.branches.hit * 100 / fileData.branches.found;
                    branchesThreshold = parseFloat(branchesThreshold.toFixed(2));
                }
                if (lineThreshold >= config.lines && branchesThreshold >= config.branches && functionThreshold >= config.functions) {
                    console.log("The file:" + filename + " passed the code coverage.")
                    grunt.log.ok();
                } else {
                    console.log("The file:" + filename + " with coverage threshold, linesThreshold: " + lineThreshold + ", branchesThreshold: " + branchesThreshold + ", functionThreshold: " + functionThreshold + " does not have the appropriate code coverage.")
                    grunt.log.error();
                    pass = false;
                }
            } else if (config.lines === 0 && config.functions === 0 && config.branches === 0) {
                console.log("Skipping file: " + filename + " as the threshold is set to 0.")
            } else {
                console.log("FAILED file:" + filename + " :: Has no code coverage data. Ensure that the source file is represented in test coverage (lcov) data");
                pass = false;
            }
        });

        if (pass === false) {
            console.log("Failed to meet code coverage threshold requirements.  This is a warning for now.  The builds will fail from V87 onwards if you do not have checkins that satisfy the standard code coverage limits (i.e. lines: 50% coverage, functions:50% coverage & branches: 50% coverage).");
        }
    };

    /**
     * This function checks that the included files satisfies all the configurations that
     * are specified in the configs object.
     *
     * @param  {Array} data  An array that contains the parsed contents of the lcov file.  See
     * @param  {Array} data  An array that contains the individual configurations for threshold validity check.  See
     * @return {none}
     */
    exports.checkThresholdValidity = function(data, configs, homeDirectory) {
        //grunt.verbose.writeln("Processing LcovData:" + data);
        configs.forEach(function(config) {
            exports.checkThresholdValidityForConfig(data, config, homeDirectory);
        });
    };


    /**
    * This function checks if the src argument is a string,  If yes: then it
    * translates that src into an array of object representation that is used for finer
    * code coverage configuration.  If the src object is not a string then it expects the src
    * object to be an array of code coverage configuration. for e.g.
    * src could either be "./src" or
    * src could be
    * [{
        path:"./src/todo",
        lines: 20,
        functions: 20,
        includes:["./src/todo/**.js"],
        excludes:["./src/todo/test/**.js"]
    * },
    * {
        path:"./src/feature",
        lines: 20,
        branches: 20,
        includes:["./src/feature/**.js"],
        excludes:["./src/feature/test/**.js"]
    * }]
    * for eg. normalizeSrcToObj("./src", 20, 20, 20,["*.js"],["abc.js"]) => [{src:"src",lines:20,functions:20,branches:20, includes:["*.js"], excludes:["abc.js"]}]
    */
    exports.normalizeSrcToObj = function(src, lines, functions, branches, includes, excludes) {
        var configs = [],
            config = {};
        if (typeof(src) === "string") {
            config.path = src;
            config.lines = lines;
            config.functions = functions;
            config.branches = branches;
            config.includes = includes;
            config.excludes = excludes;
            configs.push(config);
        } else if (Array.isArray(src)) { //typeof is of array... or has push method
            configs = src;
            configs.forEach(function(conf) {
                if (typeof conf.lines === 'undefined') {
                    conf.lines = lines;
                }
                if (typeof conf.functions === 'undefined') {
                    conf.functions = functions;
                }
                if (typeof conf.branches === 'undefined') {
                    conf.branches = branches;
                }
                if (!conf.includes) {
                    conf.includes = includes;
                }
                if (!conf.excludes) {
                    conf.excludes = excludes;
                }
                conf.path = exports.normalizeFileName(conf.path);
            });
        } else {
            grunt.fail.error("The config is not in the correct format");
        }
        return configs;
    };

    // Make them available to requiring code.
    return exports;

}());