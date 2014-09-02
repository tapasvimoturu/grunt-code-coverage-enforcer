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
 *    * Neither the name of the Yahoo! Inc. nor the
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
    minimatch = require("minimatch");

/**
 * This is a grunt task that reads a specified Lcov file and checks if the code coverage for the specified files in options meets a
 * certain threshold. Here is a sample of the available options.
 * options: {
 *              lcovfile: "relative file path from cwd,
 *              lines: <0-100>,
 *              functions: <0-100>,
 *              branches: <0-100>,
 *              src:"realtive folder location for source",
 *              includes: ["regualr expression"],
 *              excludes: ["regular expression", "regular expression"]
 *          }
 * @author Tapasvi Moturu
 */
module.exports = function(grunt) {
    grunt.registerTask("code-coverage-enforcer", "Failing of a build when (lcov) code coverage thresholds are not met", function() {

        /* Initializing the default options.
         */
        var options = this.options({
            lines: 50,
            functions: 50,
            branches: 0,
            includes: ["**/*.js"],
            src: process.cwd(),
            excludes: []
        }),

        /* This method is a decorator used to normalize the file names that are created by LCOV reporters. For ex. Intern's default LCOV reporter 
		 * has the filename when it is in the current folder but Karma add as ./ in front of the file
         */
		normalizeFilename = function(filename) {
            if (filename.substring(0, 2) === "./") {
                filename = filename.substring(2);
            } else if (filename.substring(0, 1) === "/") {
                filename = filename.substring(1);
            }
            return filename;
        };

        /**
         * This function reads the lcov string and converts it into a json object structure similar to the one below
         *
         */
        parseLcovContent = function(lcovRawString, callback) {
            //grunt.verbose.writeln("lcov content" + lcovRawString);
            var lcovData = [],
                item = {
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
                },
                infoEntries = lcovRawString.split("\n");

            infoEntries.forEach(function(entry, index) {
                entry = entry.trim();
                var parts = entry.split(":"),
                    lines, fn;
                switch (parts[0].toUpperCase()) {
                    case "SF":
                        item.file = parts.slice(1).join(":").trim();
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
                        item.branches.found = Number(parts[1]);
                        break;
                    case "BRH":
                        item.branches.hit = Number(parts[1]);
                        break;
                }

                if (entry.indexOf("end_of_record") > -1) {
                    lcovData.push(item);
                    // Resetting item to a new Json object after pushing.
                    item = {
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
                }

                if (index === infoEntries.length - 1) {
                    grunt.verbose.writeln("processing callback with " + stringify(lcovData, null, 2));
                    callback(lcovData);
                }
            });
        },

        /**
         * This function is going to read the specified file synchronously and then call the provided callback with the string content.
         * @param  {string}   file     The filename to be read.
         * @param  {Function} callback The callback to be called on successful read.
         * @return {string}            The contents of the file in string format.
         */
        readFile = function(file, callback) {
            grunt.verbose.writeln("Checking if file exists ... " + file);
            var content = fs.readFileSync(file, "utf8");
            if (content) {
                grunt.verbose.ok();
                callback(content);
            } else {
                grunt.fail.warn("Could not read from lcov file. Please ensure that that file exists");
            }
        },

        /**
         * This function checks if the
         * @param  {Array} data  An array that contains the parsed contents of the lcov file.  See
         * @return {none}
         */
        checkThresholdValidity = function(data) {
            //grunt.verbose.writeln("Processing LcovData:" + data);
            var pass = true,
            length = data.length,
            fileList = [],
            isFileExcluded = function(fileList, filename) {
                var excluded = true;
                filename = normalizeFilename(filename);

                fileList.forEach(function(f, index) {
                    if (f === filename) {
                        excluded = false;
                    }

                });
                //grunt.verbose.writeln("Checking if file is excluded: " + filename + "excluded:" + excluded);
                return excluded;
            };

            grunt.log.writeln("------------------------------------------------------------------");
            grunt.log.writeln("Scanning folder for files");
            grunt.log.writeln("------------------------------------------------------------------");

            collect(options.src, fileList, options.includes, options.excludes, null);

            fileList.forEach(function(filename, index) {
                grunt.verbose.writeln("Included:" + filename);
            });
            grunt.log.writeln("------------------------------------------------------------------");
            grunt.log.writeln("Threshold configuration: lines:" + options.lines + "%, functions:" + options.functions + "%, branches:" + options.branches + "%");
            grunt.log.writeln("------------------------------------------------------------------");

            data.forEach(function(fileData, index) {
                var lineThreshold = 100,
                    functionThreshold = 100,
                    branchesThreshold = 100;
                if (fileData.lines.hit > 0) {
                    lineThreshold = fileData.lines.hit * 100 / fileData.lines.found;
                    lineThreshold = lineThreshold.toFixed(2);
                }

                if (fileData.functions.hit > 0) {
                    functionThreshold = fileData.functions.hit * 100 / fileData.functions.found;
                    functionThreshold = functionThreshold.toFixed(2);
                }

                if (fileData.branches.hit > 0) {
                    branchesThreshold = fileData.branches.hit * 100 / fileData.branches.found;
                    branchesThreshold = branchesThreshold.toFixed(2);
                }

                var fileName = fileData.file.replace(process.cwd(), "");

                fileName = normalizeFilename(fileName);

                grunt.log.writeln("File:" + fileName);
                grunt.log.write("lines:" + lineThreshold + "% | ");
                grunt.log.write("functions:" + functionThreshold + "% | ");
                grunt.log.write("branches:" + branchesThreshold + "% | ");
                var excluded = isFileExcluded(fileList, fileName);

                if (lineThreshold >= options.lines && functionThreshold >= options.functions && branchesThreshold >= options.branches) {

                    if (excluded) {
                        grunt.log.ok("EXCLUDED");
                    } else {
                        grunt.log.ok();
                    }

                } else {

                    if (excluded) {
                        grunt.log.ok("EXCLUDED");
                    } else {
                        grunt.log.error();
                        pass = false;
                    }

                }

            });

            fileList.forEach(function(filename, index) {
                //grunt.verbose.writeln("checking file coverage in LcovData:" + filename);
                var representedInLcov = false;
                data.forEach(function(fileData, index) {
                    var lcov = fileData.file.replace(process.cwd(), "");
                    lcov = normalizeFilename(lcov);
                    //grunt.verbose.writeln("Comparing filenames:" + lcov +"," + filename);
                    if (lcov === filename) {
                        representedInLcov = true;
                    }
                });
                if (representedInLcov === false) {
                    grunt.log.error("FAILED file:" + filename + " :: Has no code coverage data. Ensure that the source file is represented in test coverage (lcov) data");
                    pass = false;
                }
            });

            if (pass === false) {
                grunt.fail.warn("Failed to meet code coverage threshold requirements");
            }

        },

        /**
         * Gathers all files that need to be checked for threshold validity.
         * @param {object} opts  options that include the src folder, includes and excludes.
         *
         */
        gather = function(opts) {
            var files = [],excludes = options.exclude,includes = options.src;

            opts.args.forEach(function(target) {
                collect(target, files, includes, excludes);
            });

            return files;
        },

        /**
         * Recursively gather all files that need to be processed,
         * excluding those that user asked to ignore.
         *
         * @param {string} fp      a path to a file or directory to lint
         * @param {array}  files   a pointer to an array that stores a list of files
         * @param {array}  includes a list of patterns for files to math
         * @param {array}  excludes a list of patterns for files to ignore
         */
        collect = function(fp, files, includes, excludes) {
            //grunt.verbose.writeln("trying to collect: " + fp +",filesLength:" + files.length +",includes:" + includes + ",excludes:"+excludes);
            //grunt.verbose.writeln("  testing for excludes");

            if (excludes && isMatched(fp, excludes)) {
                grunt.log.writeln("Exluded: " + fp);
                return;
            }

            if (!shjs.test("-e", fp)) {
                grunt.verbose.error("Can't open " + fp);
                return;
            }
            //grunt.verbose.writeln("  testing for files");

            if (shjs.test("-f", fp) || shjs.test("-L", fp)) {

                if (isMatched(fp, includes)) {
                    // /grunt.verbose.writeln("pushing file 1:" + fp);
                    files.push(fp);
                }
                return;
            }

            //grunt.verbose.writeln("  testing for directory");

            if (shjs.test("-d", fp)) {
                grunt.verbose.writeln("Collecting directory:" + fp);
                shjs.ls(fp).forEach(function(item) {

                    var itempath = path.join(fp, item);
                    if (shjs.test("-d", itempath)) {
                        collect(itempath, files, includes, excludes);
                    } else {

                        collect(itempath, files, includes, excludes);
                        return;
                    }
                });

                return;
            }
        },

        /**
         * Checks whether a file matches the list of patterns specified.
         *
         * @param {string} fp       a path to a file
         * @param {array}  patterns a list of patterns for files  matching
         *
         * @return {boolean} "true" if file matches, "false" if file doesnt match.
         */
        isMatched = function(fp, patterns) {
            //grunt.verbose.writeln("Matching file:" + fp +" with pattern:" + patterns);
            return patterns.some(function(ip) {
                //grunt.verbose.writeln("  checking for match with: " + ip);
                var file = path.resolve(fp).replace(process.cwd(), "").trim();

                file = normalizeFilename(file);

                if (minimatch(file, ip, {
                    nocase: true
                })) {
                    //grunt.verbose.writeln(file + ", Matched::file with regular expression");
                    return true;
                }

                if (file === ip) {
                    //grunt.verbose.writeln(fp + ", Matched::file exactly");
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

        grunt.verbose.writeln("Checking code coverage for threshold limits ....");
        grunt.verbose.writeln("Reading the lcov file ....");

        if (options.lcovfile) {
            grunt.verbose.writeln("Processing File:" + options.lcovfile);
            readFile(options.lcovfile, function(content) {
                parseLcovContent(content, function(lcovJson) {
                    var files = [];

                    checkThresholdValidity(lcovJson);
                });
            });
        }

    });
};