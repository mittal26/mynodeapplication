const config   = require('config');

module.exports = function() {
    if(!config.get('GMAIL_EMAIL') && !config.get('GMAIL_PASSWORD')){
       throw new Error('Fatal Error:PrivateKey is not defined!');
    }
}