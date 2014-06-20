/* jshint node: true */

module.exports = {
    compile: {
        options: {
            baseUrl: ".",
            preserveLicenseComments: false,
            optimize: "none",
            paths: {
                "components": "empty:",
                "jquery": "empty:",
                "underscore": "empty:",
                "dojo": "empty:",
                "morpheus": "src"
            },
            include: [
                "morpheus/BaseObject",
                "morpheus/EventListenerMixin",
                "morpheus/EventMixin"
            ],
            out: "build/dist/morpheus.js"
        }
    }
};