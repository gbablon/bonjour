var dateFormat = require('dateformat'), 
    http = require('http'), 
    xml2js = require('xml2js');

module.exports = function(options){
  return {
    update: function(transitData, cb) {
      transitData.status = "NO DATA";
      var url = 'http://web.mta.info/status/serviceStatus.txt';
      http.get(url, function(res){
        var data = '';
        res.on('data', function(chunk){ data += chunk; });
        res.on('end', function(){
          xml2js.parseString(data, function(err, data) {
            var trainLines = data.service.subway[0].line;
            for(var i = 0; i < trainLines.length; i++) {
              var line = trainLines[i];
              if(line.name[0].toLowerCase().includes(options.subwayLine.toLowerCase())) {
                transitData.status = line.status[0];
                var desc = line.text[0];
                var pos1 = desc.indexOf('[F]');
                desc = desc.substring(pos1);
                //transitData.data.desc = desc;
                transitData.desc = "";
                //transitData.data.time = dateFormat(TIME, 'h:MM tt');
                transitData.time = line.Time[0];
              }
            }
            switch(transitData.status) {
              case "GOOD SERVICE":
                transitData.statusString = "All clear";
                transitData.statusIcon = "/img/icon_check.png";
                break;
              case "SERVICE CHANGE":
                transitData.statusString = "Service change";
                transitData.statusIcon = "/img/icon_warn.png";
                break;
              case "PLANNED WORK":
                transitData.statusString = "Planned work";
                transitData.statusIcon = "/img/icon_warn.png";
                break;
              default:
                transitData.statusString = "???";
                transitData.statusIcon = "/img/icon_help.png";
                break;
            }
            cb(transitData);
          })
        });
      });
    }
  };
}