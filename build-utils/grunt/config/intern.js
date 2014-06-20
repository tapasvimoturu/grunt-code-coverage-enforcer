/* jshint node: true */

module.exports = {
    runner: {
        options: {
            config: "test/config/intern",
            runType: "runner",
            reporters: ["console", "lcovhtml", "lcov", "cobertura"]
        }
    }
};