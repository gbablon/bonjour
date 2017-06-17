/*
 * Set up server & environment
 */

var express = require('express'), // our server
    http = require('http'), 
    Q = require("q");

var app = express();

var credentials = require('./credentials.js');

// set up the port to listen on
app.set('port', process.env.PORT || 3001);

// set up our static resource directory
app.use(express.static(__dirname + '/public'));

/*
 * Set up data services
 */

// weather service
var weatherData = {
  lastRefreshed: 0,
  refreshInterval: 15 * 60 * 1000, // Cache for 15m
};

var weatherService = require('./lib/weather')({
  apiKey: credentials.WeatherUnderground.ApiKey, 
  location: '11231'
});

function retrieveWeatherData(cb) {
  if(Date.now() < weatherData.lastRefreshed + weatherData.refreshInterval) {
    return setImmediate(function() { cb(weatherData); });
  }
  weatherData.lastRefreshed = Date.now();
  weatherService.update(weatherData, cb);
}

// mta transit service
var transitData = {
  lastRefreshed: 0,
  lastRefreshedString: 0, 
  refreshInterval: 15 * 60 * 1000, // Cache for 15m
};

var transitService = require('./lib/transit')({
  subwayLine: 'F'
});

function retrieveTransitData(cb) {
  if(Date.now() < transitData.lastRefreshed + transitData.refreshInterval) {
    return setImmediate(function() { cb(transitData); });
  }
  transitData.lastRefreshed = Date.now();
  transitService.update(transitData, cb);
}

// calendar service
var calendarData = {
  lastRefreshed: 0,
  lastRefreshedString: 0, 
  refreshInterval: 15 * 60 * 1000, // Cache for 15m
  data: {}
};

var calendarService = require('./lib/calendar')({
  scopes: ['https://www.googleapis.com/auth/calendar.readonly'], 
  token_dir: '.credentials/', 
  token_path: 'google_calendar_secret.json'
});

function retrieveCalendarData(cb) {
  if(Date.now() < calendarData.lastRefreshed + calendarData.refreshInterval) {
    return setImmediate(function() { cb(calendarData); });
  }
  calendarData.lastRefreshed = Date.now();
  calendarService.update(calendarData, cb);
}

/*
 * Set up templating engine
*/

var handlebars = require('express-handlebars').create({ 
  defaultLayout: 'main', 
  helpers: {
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
 * Set up routes
 */

// set up primary app route
app.get('/', function(req, res){ 
  res.render('home');
});

// set up API routes
app.get('/weather', function(req, res) {
  retrieveWeatherData(function(data) {
    res.json({ data }); 
  });
})

app.get('/transit', function(req, res) {
  retrieveTransitData(function(data) {
    res.json({ data }); 
  });
})

app.get('/calendar', function(req, res) {
  retrieveCalendarData(function(data) {
    res.json({ data }); 
  });
});

/*
 * Run server
 */

// run `export NODE_ENV=production` to change env
app.listen(app.get('port'), function(){
  console.log( 'Express started in ' + app.get('env') + ' mode on http://localhost:' + app.get('port') 
    + '; press Ctrl-C to terminate.' );
});