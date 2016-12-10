var dateFormat = require('dateformat'), 
    fs = require('fs'), 
    readline = require('readline'), 
    google = require('googleapis'), 
    googleAuth = require('google-auth-library');

module.exports = function(options){
  return {
    update: function(calendarData, cb) {
      // Load client secrets from a local file.
      fs.readFile('google_secret.json', function processClientSecrets(err, content) {
        if (err) {
          console.log('Error loading client secret file: ' + err);
          return;
        }
        // Authorize a client with the loaded credentials, then call the Google Calendar API.
        authorize(JSON.parse(content), function(auth) {
          var calendar = google.calendar('v3');
          calendar.events.list({
            auth: auth,
            calendarId: 'tb7sm1e0hub7je4et1ksr70rm4@group.calendar.google.com',
            timeMin: (new Date()).toISOString(),
            maxResults: 5,
            singleEvents: true,
            orderBy: 'startTime'
          }, function(err, response) {
            if (err) {
              console.log('The API returned an error: ' + err);
              return;
            }
            var events = response.items;
            var eventsSimple = [];
            if (events.length > 0) {
              for (var i = 0; i < events.length; i++) {
                var event = events[i];
                var start = event.start.dateTime || event.start.date;
                var startString = "";
                if(dateFormat(start, 'isoDate') == dateFormat(Date.now(), 'isoDate')) {
                  startString = "Today " + dateFormat(start, 'h:MMTT');
                } else {
                  startString = dateFormat(start, 'ddd mmm dd h:MMTT');
                }
                eventsSimple.push({
                  'start': startString, 
                  'summary': event.summary
                });
              }
            }
            calendarData.events = eventsSimple;
            cb(calendarData);
          });
        });
      });
    }
  };

  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   *
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  function authorize(credentials, callback) {
    var clientSecret = credentials.installed.client_secret;
    var clientId = credentials.installed.client_id;
    var redirectUrl = credentials.installed.redirect_uris[0];
    var auth = new googleAuth();
    var oauth2Client = new auth.OAuth2(clientId, clientSecret, redirectUrl);

    // Check if we have previously stored a token.
    fs.readFile(options.token_path, function(err, token) {
      if (err) {
        getNewToken(oauth2Client, callback);
      } else {
        oauth2Client.credentials = JSON.parse(token);
        callback(oauth2Client);
      }
    });
  }

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   *
   * @param {google.auth.OAuth2} oauth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback to call with the authorized
   *     client.
   */
  function getNewToken(oauth2Client, callback) {
    var authUrl = oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: options.scopes
    });
    console.log('Authorize this app by visiting this url: ', authUrl);
    var rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    rl.question('Enter the code from that page here: ', function(code) {
      rl.close();
      oauth2Client.getToken(code, function(err, token) {
        if (err) {
          console.log('Error while trying to retrieve access token', err);
          return;
        }
        oauth2Client.credentials = token;
        storeToken(token);
        callback(oauth2Client);
      });
    });
  }

  /**
   * Store token to disk be used in later program executions.
   *
   * @param {Object} token The token to store to disk.
   */
  function storeToken(token) {
    try {
      fs.mkdirSync(options.token_dir);
    } catch (err) {
      if (err.code != 'EEXIST') {
        throw err;
      }
    }
    fs.writeFile(options.token_dir + options.token_path, JSON.stringify(token));
    console.log('Token stored to ' + options.token_path);
  }
}