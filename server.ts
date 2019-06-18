import 'zone.js/dist/zone-node';
import { enableProdMode } from '@angular/core';

// Express Engine
import { ngExpressEngine } from '@nguniversal/express-engine';
// Import module map for lazy loading
import { provideModuleMap } from '@nguniversal/module-map-ngfactory-loader';

import * as express from 'express';
import { join } from 'path';

// Faster server renders w/ Prod mode (dev mode never needed)
enableProdMode();

// Express server
const app = express();

const PORT = process.env.PORT || 443;
const DIST_FOLDER = join(process.cwd(), 'dist');

// * NOTE :: leave this as require() since this file is built Dynamically from webpack
const { AppServerModuleNgFactory, LAZY_MODULE_MAP } = require('./server/main');

const domino = require('domino');
const fs = require('fs');
const path = require('path');

const template = fs.readFileSync(
    join(DIST_FOLDER, "browser", "index.html")
).toString();
const win = domino.createWindow(template);



var http = require('http');
var https = require('https');
var privateKey  = fs.readFileSync('/etc/letsencrypt/live/dsp.mest.net/privkey.pem', 'utf8');
var certificate = fs.readFileSync('/etc/letsencrypt/live/dsp.mest.net/fullchain.pem', 'utf8');
var credentials = {key: privateKey, cert: certificate};







global['window'] = win;
global['window']['document'] = win;
global['document'] = win.document;

// Our Universal express-engine (found @ https://github.com/angular/universal/tree/master/modules/express-engine)
app.engine('html', ngExpressEngine({
  bootstrap: AppServerModuleNgFactory,
  providers: [
    provideModuleMap(LAZY_MODULE_MAP)
  ]
}));

app.set('view engine', 'html');
app.set('views', join(DIST_FOLDER, 'browser'));

// Example Express Rest API endpoints
// app.get('/api/**', (req, res) => { });

// Server static files from /browser
app.get('*.*', express.static(join(DIST_FOLDER, 'browser'), {
  maxAge: '1y'
}));

// All regular routes use the Universal engine
app.get('*', (req, res) => {
  res.render('index', { req });
});


var httpServer = https.createServer(credentials, app);

// Start up the Node server
httpServer.listen(PORT, () => {
  console.log(`Secure Express server listening on port ${PORT}`);
});



