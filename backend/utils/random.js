const crypto = require('crypto');

const randomString = (Length) => {
    return crypto.randomBytes(20).toString('hex');
}

module.exports = {randomString}