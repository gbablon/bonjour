var http = require('http'), 
    Q = require("q");

module.exports = function(options){

  return {
    update: function(weatherData, cb) {
      var conditionsCall = function(weatherData) {
        var deferred = Q.defer();
        //var url = 'http://api.wunderground.com/api/' + options.apiKey + '/conditions/q/' + options.location + '.json';
        var url = 'http://localhost:3000/conditions.json';
        http.get(url, function(res){
          var data = '';
          res.on('data', function(chunk){ data += chunk; });
          res.on('end', function(){
            data = JSON.parse(data);
            weatherData.weather = data.current_observation.weather;
            weatherData.icon = getWeatherIcon(data.current_observation.icon);
            weatherData.temp = Math.round(data.current_observation.temp_c);
            deferred.resolve(weatherData);
          });
        });
        return deferred.promise;
      };

      var forecastCall = function(weatherData) {
        var deferred = Q.defer();
        //var url = 'http://api.wunderground.com/api/' + options.apiKey + '/forecast/q/' + options.location + '.json';
        var url = 'http://localhost:3000/forecast.json';
        http.get(url, function(res){
          var data = '';
          res.on('data', function(chunk){ data += chunk; });
          res.on('end', function(){
            data = JSON.parse(data);
            weatherData.forecastToday = data.forecast.txt_forecast.forecastday[0].fcttext_metric;
            weatherData.forecastTonight = data.forecast.txt_forecast.forecastday[1].fcttext_metric;
            deferred.resolve(weatherData);
          });
        });
        return deferred.promise;
      };

      conditionsCall(weatherData)
          .then(forecastCall)
          .then(function(weatherData) { cb(weatherData); }, console.error);
    }
  };
}

function getWeatherIcon(icon) {
  switch(icon) {
    case "chanceflurries": 
      return "/img/icon_snow.png";
    case "chancerain": 
      return "/img/icon_rain.png";
    case "chancesleet": 
      return "/img/icon_hail.png";
    case "chancesnow": 
      return "/img/icon_snow.png";
    case "chancetstorms": 
      return "/img/icon_tstorms.png";
    case "clear": 
      return "/img/icon_clear.png";
    case "flurries": 
      return "/img/icon_snow.png";
    case "fog": 
      return "/img/icon_fog.png";
    case "hazy": 
      return "/img/icon_fog.png";
    case "mostlycloudy": 
      return "/img/icon_mostlycloudy.png";
    case "mostlysunny": 
      return "/img/icon_partlycloudy.png";
    case "partlycloudy": 
      return "/img/icon_partlycloudy.png";
    case "partlysunny": 
      return "/img/icon_partlycloudy.png";
    case "sleet": 
      return "/img/icon_hail.png";
    case "rain": 
      return "/img/icon_rain.png";
    case "snow": 
      return "/img/icon_snow.png";
    case "tstorms": 
      return "/img/icon_tstorms.png";
    case "cloudy":
      return "/img/icon_cloudy.png";
  }
}