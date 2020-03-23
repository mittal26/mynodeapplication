const express        = require('express');
const app            = express();
const path           = require('path');

app.set('views',path.join(__dirname,'views'));
app.set('view engine','ejs');

require('./startup/db')();
require('./startup/config')();
require('./startup/routes')(app);

const port = process.env.PORT || 3000 ;

app.listen(port, () => {
    console.log(`Listening on port ${port}`);
});

