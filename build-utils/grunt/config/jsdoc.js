/* jshint node: true */

module.exports = {
    dist: {
        src: ["tasks/*.js", "test/*.js"],
        options: {
            destination: "build/jsdoc"
        }
    }
};