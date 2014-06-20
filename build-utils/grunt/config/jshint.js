/* jshint node: true */

module.exports = {
    gruntfile: {
        options: {
            jshintrc: ".jshintrcgruntfile"
        },
        src: "Gruntfile.js"
    },
    source: {
        src: ["tasks/**/*.js"]
    },
    test: {
        src: ["test/**/*.js"]
    },
    requirements: {
        src: ["requirements/**/*.js"]
    }
};