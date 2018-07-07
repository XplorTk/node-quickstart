const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
require('dotenv').config();

const app = express();
app.use(express.static(__dirname + '/public'));
app.set('views', path.join(__dirname, '/public', '/views'));
app.set('view engine', 'ejs'); // Use EJS templating engine to render webpages
app.use(bodyParser.json());

const routes = require('./routes')();
app.use('/', routes);

/**
 * Start server
 */
const port = process.env.PORT || 3000;
app.listen(port, (err) => {
	if (err) {
		return console.error('Error starting up server', err);
	}
	console.log(`Listening on ${port} - see the sample app at http://localhost:${port}`);
});

module.exports = app;
