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
    util = require("./lib/code-coverage-enforcer-lib"),
    minimatch = require("minimatch"),
    grunt = require("grunt");

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
                src: process.cwd(), //array { path: "",thresholds: {} }
                excludes: [],
                filter: function(fp) {
                    return false;
                }
            });
        

        grunt.verbose.writeln("Checking code coverage for threshold limits ....");
        grunt.verbose.writeln("Reading the lcov file ....");

        options.lcovfile = util.normalizeOSPath(options.lcovfile);
        options.includes = util.normalizeOSPath(options.includes);
        options.excludes = util.normalizeOSPath(options.excludes);

        //Adapt the original options to the list of configs that will be used for validating the code coverage.
        options.src = util.normalizeSrcToObj(options.src, options.lines, options.functions, options.branches, options.includes, options.excludes, options.filter);
        // options.src = util.normalizeOSPath(options.src);

        if (options.lcovfile) {
            grunt.verbose.writeln("Processing File:" + options.lcovfile);
            //Read the lcov file and pass the contents of the file to the anonymous function.
            util.readFile(options.lcovfile, function(content) {
                //parse the lcov content and pass the json representation of the data to the anonymous function.
                util.parseLcovContent(content, function(lcovJson) {
                    //Check the threshold validity using the lcovJson with all the passed in configs
                    util.checkThresholdValidity(lcovJson, options.src);
                });
            });
        }

    });
};
