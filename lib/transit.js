var dateFormat = require('dateformat'), 
    http = require('http'), 
    xml2js = require('xml2js');

module.exports = function(options){
  return {
    update: function(transitData, cb) {
      transitData.data.status = "NO DATA";
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
                transitData.data.status = line.status[0];
                var desc = line.text[0];
                var pos1 = desc.indexOf('[F]');
                desc = desc.substring(pos1);
                //transitData.data.desc = desc;
                transitData.data.desc = "";
                //transitData.data.time = dateFormat(TIME, 'h:MM tt');
                transitData.data.time = line.Time[0];
              }
            }
            switch(transitData.data.status) {
              case "GOOD SERVICE":
                transitData.data.statusString = "All clear";
                transitData.data.statusIcon = "/img/icon_check.png";
                break;
              case "SERVICE CHANGE":
                transitData.data.statusString = "Service change";
                transitData.data.statusIcon = "/img/icon_warn.png";
                break;
              case "PLANNED WORK":
                transitData.data.statusString = "Planned work";
                transitData.data.statusIcon = "/img/icon_warn.png";
                break;
              default:
                transitData.data.statusString = "???";
                transitData.data.statusIcon = "/img/icon_help.png";
                break;
            }
            cb(transitData);
          })
        });
      });
    }
  };
}