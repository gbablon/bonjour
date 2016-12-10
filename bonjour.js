/*
 * Set up server
 */

var express = require('express'), // our server
    http = require('http'), 
    Q = require("q");

var app = express();

var credentials = require('./credentials.js');

// weather service
var weatherData = {
  lastRefreshed: 0,
  refreshInterval: 15 * 60 * 1000, // Cache for 15m
};

var weatherService = require('./lib/weather')({
  apiKey: credentials.WeatherUnderground.ApiKey, 
  location: '11231'
});

// mta transit service
var transitService = require('./lib/transit')({
  subwayLine: 'F'
});

// calendar service
var calendarService = require('./lib/calendar')({
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'], 
  token_dir: (process.env.HOME || process.env.HOMEPATH || process.env.USERPROFILE) + '/.credentials/', 
  token_path: 'calendar-nodejs-quickstart.json'
});

// set up the port to listen on
app.set('port', process.env.PORT || 3000);

// set up our static resource directory
app.use(express.static(__dirname + '/public'));

/*
 * Set up templating engine
*/
var handlebars = require('express-handlebars').create({ 
  defaultLayout: 'main', 
  helpers: {
    // define view helpers (used for 'head' and 'jquery' here)
    section: function(name, options) { 
      if(!this._sections) this._sections = {};
      this._sections[name] = options.fn(this);
      return null;
    }
  }
});
app.engine('handlebars', handlebars.engine);
app.set('view engine', 'handlebars');

/*
 * Retrieve weather data
 */

function retrieveWeatherData(cb) {
  if(Date.now() < weatherData.lastRefreshed + weatherData.refreshInterval) {
    return setImmediate(function() { cb(weatherData); });
  }
  weatherData.lastRefreshed = Date.now();
  weatherService.update(weatherData, cb);
}

// middleware to add weather to page context
app.use(function(req, res, next) {
  retrieveWeatherData(function(data) {
    if(!res.locals.partialsData) res.locals.partialsData = {};
    res.locals.partialsData.weather = data;
    next();
  });
});

/*
 * Retrieve transit data
 */
var transitData = {
  lastRefreshed: 0,
  lastRefreshedString: 0, 
  refreshInterval: 15 * 60 * 1000, // Cache for 15m
  data: {}
};

function retrieveTransitData(cb) {
  if(Date.now() < transitData.lastRefreshed + transitData.refreshInterval) {
    return setImmediate(function() { cb(transitData); });
  }
  transitData.lastRefreshed = Date.now();
  transitService.update(transitData, cb);
}

app.use(function(req, res, next) {
  retrieveTransitData(function(data) {
    if(!res.locals.partialsData) res.locals.partialsData = {};
    res.locals.partialsData.transit = data;
    next();
  });
});

/*
 * Retrieve calendar data
 */
 var calendarData = {
  lastRefreshed: 0,
  lastRefreshedString: 0, 
  refreshInterval: 15 * 60 * 1000, // Cache for 15m
  data: {}
};

function retrieveCalendarData(cb) {
  if(Date.now() < calendarData.lastRefreshed + calendarData.refreshInterval) {
    return setImmediate(function() { cb(calendarData); });
  }
  calendarData.lastRefreshed = Date.now();
  calendarService.update(calendarData, cb);
}

// app.use(function(req, res, next) {
//   retrieveCalendarData(function(data) {
//     if(!res.locals.partialsData) res.locals.partialsData = {};
//     res.locals.partialsData.calendar = data;
//     next();
//   });
// });

/*
 * Set up primary route
 */
app.get('/', function(req, res){ 
  res.render('home');
});

app.get('/weather', function(req, res) {
  retrieveWeatherData(function(data) {
    res.json({ data }); 
  });
})

/*
 * Run server
 */

// run `export NODE_ENV=production` to change env
app.listen(app.get('port'), function(){
  console.log( 'Express started in ' + app.get('env') + ' mode on http://localhost:' + app.get('port') 
    + '; press Ctrl-C to terminate.' );
});