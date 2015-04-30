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
        var content = fs.readFileSync(exports.normalizeFileName(file), "utf8");
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
    exports.parseLcovContent = function(lcovRawString, callback) {
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
    };

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
     * Checks whether a file matches the list of patterns specified.
     *
     * @param {string} fp       a path to a file
     * @param {array}  patterns a list of patterns for files  matching
     *
     * @return {boolean} "true" if file matches, "false" if file doesnt match.
     */
    exports.isMatched = function(fp, patterns) {
        //grunt.verbose.writeln("Matching file:" + fp +" with pattern:" + patterns);
        return patterns.some(function(ip) {
            //grunt.verbose.writeln("  checking for match with: " + ip);
            var file = path.resolve(fp).replace(process.cwd(), "").trim();

            file = exports.normalizeFileName(file);

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

    /**
     * Gathers all files that need to be checked for threshold validity.
     * @param {object} opts  options that include the src folder, includes and excludes.
     *
     */
    exports.gather = function(opts) {
        var files = [],
            excludes = options.exclude,
            filter = options.filter,
            includes = options.src;

        opts.args.forEach(function(target) {
            collect(target, files, includes, excludes, filter);
        });

        return files;
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
    exports.collect = function(fp, files, includes, excludes, filter) {
        //grunt.verbose.writeln("trying to collect: " + fp +",filesLength:" + files.length +",includes:" + includes + ",excludes:"+excludes);
        //grunt.verbose.writeln("  testing for excludes");

        if (excludes && exports.isMatched(fp, excludes)) {
            if ((filter && filter(fp) || !filter) {
                grunt.log.writeln("Exluded: " + fp);
                return;
            }
        }

        if (!shjs.test("-e", fp)) {
            grunt.verbose.error("Can't open " + fp);
            return;
        }
        //grunt.verbose.writeln("  testing for files");

        if (shjs.test("-f", fp) || shjs.test("-L", fp)) {

            if (exports.isMatched(fp, includes)) {
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
                    exports.collect(itempath, files, includes, excludes, filter);
                } else {
                    exports.collect(itempath, files, includes, excludes, filter);
                    return;
                }
            });

            return;
        }
    };

    /**
     * Checks whether a file matches the list of patterns specified.
     *
     * @param {string} fp       a path to a file
     * @param {array}  patterns a list of patterns for files  matching
     *
     * @return {boolean} "true" if file matches, "false" if file doesnt match.
     */
    exports.isMatched = function(fp, patterns) {
        //grunt.verbose.writeln("Matching file:" + fp +" with pattern:" + patterns);
        return patterns.some(function(ip) {
            //grunt.verbose.writeln("  checking for match with: " + ip);
            var file = path.resolve(fp).replace(process.cwd(), "").trim();

            file = exports.normalizeFileName(file);

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

    /**
     * This function checks if the source file that are included in the config object satisfies
     * the code coverage threshold specified in the configuration.
     *
     * @param  {Array} data  An array that contains the parsed contents of the lcov file.  See
     * @param  {config} data  Config for checking validity check for a specific folder.  See
     * @return {none}
     */
    exports.checkThresholdValidityForConfig = function(data, config) {
        var src = config.path,
            lines = config.lines,
            functions = config.functions,
            branches = config.branches,
            includes = config.includes,
            excludes = config.excludes,
            filter = config.filter,
            pass = true,
            length = data.length,
            fileList = [],
            isFileExcluded = function(fileList, filename) {
                var excluded = true;
                filename = exports.normalizeFileName(filename);
                fileList.forEach(function(f, index) {
                    if (f === filename) {
                        excluded = false;
                    }

                    f = exports.normalizeFileName(f.replace(process.cwd(),""));
                    if(f === filename) {
                        excluded = false;
                    }
                });
                //grunt.verbose.writeln("Checking if file is excluded: " + filename + "excluded:" + excluded);
                return excluded;
            },
            isFileInPath = function(src, filename) {
                var included = false,
                normalizedSrc = exports.normalizeFileName(src);
                filename = exports.normalizeFileName(filename);
                if(filename.indexOf(normalizedSrc) !== -1){
                    included = true;
                }

                //grunt.verbose.writeln("Checking if file is excluded: " + filename + "excluded:" + excluded);
                return included;
            };
        grunt.log.writeln("------------------------------------------------------------------");
        grunt.log.writeln("Running threshold checks for the following path config:" + config.path);
        grunt.verbose.writeln("Current config:" + JSON.stringify(config));
        grunt.log.writeln("------------------------------------------------------------------");
        grunt.log.writeln("------------------------------------------------------------------");
        grunt.log.writeln("Scanning folder for files");
        grunt.log.writeln("------------------------------------------------------------------");

        exports.collect(src, fileList, includes, excludes, filter);

        fileList.forEach(function(filename, index) {
            grunt.verbose.writeln("Included:" + filename);
        });
        grunt.log.writeln("------------------------------------------------------------------");
        grunt.log.writeln("Threshold configuration: lines:" + lines + "%, functions:" + functions + "%, branches:" + branches + "%");
        grunt.log.writeln("------------------------------------------------------------------");

        data.forEach(function(fileData, index) {
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

            var fileName = fileData.file.replace(process.cwd(), "");

            fileName = exports.normalizeFileName(fileName);
            var included = isFileInPath(src, fileName);
            if(included) {
                grunt.log.writeln("File:" + fileName);
                grunt.log.write("lines:" + lineThreshold + "% | ");
                grunt.log.write("functions:" + functionThreshold + "% | ");
                grunt.log.write("branches:" + branchesThreshold + "% | ");
                var excluded = isFileExcluded(fileList, fileName);

                if(!excluded) {
                    if (lineThreshold >= lines && functionThreshold >= functions && branchesThreshold >= branches) {
                        grunt.log.ok();
                    } else {
                        grunt.log.error();
                        pass = false;
                    }
                } else {
                    grunt.log.ok("EXCLUDED");
                }
            } else {
                grunt.verbose.writeln("File:" + fileName);
                grunt.verbose.write("lines:" + lineThreshold + "% | ");
                grunt.verbose.write("functions:" + functionThreshold + "% | ");
                grunt.verbose.write("branches:" + branchesThreshold + "% | ");
                grunt.verbose.writeln("SKIPPED");
            }
        });

        fileList.forEach(function(filename, index) {
            var representedInLcov = false;
            data.forEach(function(fileData, index) {
                var lcov = fileData.file.replace(process.cwd(), "");
                lcov = exports.normalizeFileName(lcov);
                //grunt.verbose.writeln("Comparing filenames:" + lcov +"," + filename);
                var normalizedFileName = exports.normalizeFileName(filename.replace(process.cwd(),""));
                if (lcov === normalizedFileName) {
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
    };

    /**
     * This function checks that the included files satisfies all the configurations that 
     * are specified in the configs object.
     * 
     * @param  {Array} data  An array that contains the parsed contents of the lcov file.  See
     * @param  {Array} data  An array that contains the individual configurations for threshold validity check.  See
     * @return {none}
     */
    exports.checkThresholdValidity = function(data, configs) {
        //grunt.verbose.writeln("Processing LcovData:" + data);
        configs.forEach(function(config) {
            exports.checkThresholdValidityForConfig(data, config);
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
    exports.normalizeSrcToObj = function(src, lines, functions, branches, includes, excludes, filter) {
        var configs = [], config ={};
        if(typeof(src)==="string") {
            config.path = src;
            config.lines = lines;
            config.functions = functions;
            config.branches = branches;
            config.includes = includes;
            config.excludes = excludes;
            config.filter = filter;
            configs.push(config);
        } else if(Array.isArray(src)) {//typeof is of array... or has push method
            configs = src;
            configs.forEach(function(conf) {

                if(!conf.lines) {
                    conf.lines = lines;
                }

                if(!conf.functions) {
                    conf.functions = functions;
                }

                if(!conf.branches) {
                    conf.branches = branches;
                }

                if(!conf.includes) {
                    conf.includes = includes;
                }

                if(!conf.excludes) {
                    conf.excludes = excludes;
                }
                
                if(!conf.filter) {
                    conf.excludes = filter;
                }
            });
        } else {
            grunt.fail.error("The config is not in the correct format");
        }

        configs.forEach(function(config) {
            config.path = exports.normalizeFileName(config.path);
        });
        return configs;
    };

    // Make them available to requiring code.
    return exports;

}());
