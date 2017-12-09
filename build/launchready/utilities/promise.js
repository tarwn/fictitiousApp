var Promise = require("bluebird");

module.exports = function promiseWhile(predicate, action) {
    function loop() {
        if (!predicate()) return;
        return Promise.resolve(action()).then(loop);
    }
    return Promise.resolve().then(loop);
};