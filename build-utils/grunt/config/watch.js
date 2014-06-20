/* jshint node: true */

module.exports = {
    gruntfile: {
        files: "<%= jshint.gruntfile.src %>",
        tasks: ["jshint:gruntfile"]
    },
    source: {
        files: "<%= jshint.source.src %>",
        tasks: ["jshint:source"]
    },
    test: {
        files: "<%= jshint.test.src %>",
        tasks: ["jshint:test"]
    }
};