"use strict";
/* jshint node: true */
module.exports = function(grunt) {
    var path = require("path"),
        banner;

    banner = "/*! <%= pkg.name %> - v<%= pkg.version %> - " +
            "<%= grunt.template.today('yyyy-mm-dd') %>\n" +
            "<%= pkg.homepage ? '* ' + pkg.homepage + '\\n' : '' %>" +
            "* Copyright (c) <%= grunt.template.today('yyyy') %> <%= pkg.author.name %>;" +
            " Licensed <%= _.pluck(pkg.licenses, 'type').join(', ') %> */\n";

    require("time-grunt")(grunt);
    //Load our custom tasks
    //grunt.loadTasks("build-utils/grunt/tasks");

    require("load-grunt-config")(grunt, {
        configPath: path.join(process.cwd(), "build-utils/grunt/config"), //path to task.js files, defaults to grunt dir
        init: true, //auto grunt.initConfig
        data: { //data passed into config.  Can use with <%= test %>
            banner: banner,
            pkg: grunt.file.readJSON("package.json"),
            devServerPort: 9998
        },
        loadGruntTasks: { //can optionally pass options to load-grunt-tasks.  If you set to false, it will disable auto loading tasks.
            pattern:  ["grunt-*", "intern"]
        }
    });
    // Actually load this plugin's task(s).
    grunt.loadTasks('tasks');

    //Linting tasks
    grunt.registerTask("lint", ["jshint", "jscs"]);

    //Documentation
    grunt.registerTask("documentation", ["jsdoc"]);

    // Default task.
    grunt.registerTask("default", ["clean:build", "lint", "documentation"]);
};