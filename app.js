// npm install express rem
var rem = require('rem')
  , twitter = require('./routes/twitter')
  , express = require('express')
  , path = require('path')

/**
 * Express.
 */

var app = express();

app.configure(function () {
  app.set('port', process.env.PORT || 3000);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.set('secret', process.env.SESSION_SECRET || 'terrible, terrible secret')
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(express.cookieParser(app.get('secret')));
  app.use(express.session());
  app.use(app.router);
  app.use(express.static(path.join(__dirname, 'public')));
});

app.configure('development', function () {
  app.set('host', 'localhost:' + app.get('port'));
  app.use(express.errorHandler());
});

app.configure('production', function () {
  app.set('host', process.env.HOST);
});

//------------------setup twitter-----------------------

var twitter = rem.connect('twitter.com').configure({
  key: process.env.TWITTER_KEY,
  secret: process.env.TWITTER_SECRET
});

//----------------Twitter login/logout via REM-----------

var oauth = rem.oauth(twitter, 'http://' + app.get('host') + '/oauth/callback');

app.get('/login/', oauth.login());

app.use(oauth.middleware(function (req, res, next) {
  console.log("The user is now authenticated.");
  res.redirect('/');
}));

app.get('/logout/', oauth.logout(function (req, res) {
  res.redirect('/');
}));

// session storing 
app.all('/*', function (req, res, next) {
  req.api = oauth.session(req);
  next();
});

function loginRequired (req, res, next) {
  if (!req.api) {
    res.redirect('/login/');
  } else {
    next();
  }
}

//--------------------Splash page------------------------

app.get('/', loginRequired, function (req, res) {
  req.api('account/verify_credentials').get(function (err, profile) {
    res.send('Hi ' + profile.screen_name + '! <form action="/status" method="post"><input name="status"><button>Post Status</button></form>');
  });
});

//---------------Twitter functionality-------------------


// POST(tweeting)
app.post('/status', loginRequired, function (req, res) {
  req.api('statuses/update').post({
    status: req.body.status
  }, function (err, json) {
    if (err) {
      res.json({error: err});
    } else {
      res.redirect('http://twitter.com/' + json.user.screen_name + '/status/' + json.id_str);
    }
  });
})



// GET (streaming)
var carrier = require('carrier');

// opening a port for streaming tweets 
app.listen(app.get('port'), function () {
  console.log('Listening on http://' + app.get('host'))
});

app.get('/stream', loginRequired, function (req, res) {
  req.api.stream('statuses/filter').post({
    track: ['obama', 'usa']
  }, function (err, stream) {
    carrier.carry(stream, function (line) {
      var line = JSON.parse(line);
      res.write(line.text + '\n');
    });
  });
})


/* Attempt at a refactor, not possible, so should use module
// opening a port for streaming tweets 
app.listen(app.get('port'), function () {
  console.log('Listening on http://' + app.get('host'))
});

// GETS
app.get('/stream', loginRequired, twitter.stream);

// POSTS
app.post('/status', loginRequired, twitter.tweet);
*/





