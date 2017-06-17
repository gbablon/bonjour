var _ = require('lodash'), 
    dateFormat = require('dateformat'),
    http = require('http'), 
    twilio = require('twilio');

module.exports = function(options){
  return {
    update: function(remindersData, cb) {
      var accountSid = 'ACe86b579d062fd7dd19f389bbe8263ffa'; // Your Account SID from www.twilio.com/console
      var authToken = '1d5c5924696897196d3818dfbb614b39';   // Your Auth Token from www.twilio.com/console

      var twilioClient = new twilio(accountSid, authToken);

      var reminders = [];

      twilioClient.messages.list({ PageSize: 3 }, function(err, messages) {
        _.each(messages, function(message) {
          var tidyFrom = message.from;
          switch(message.from) {
            case "+12157607838":
              tidyFrom = "Geoffroy";
              break;
            case "+17035319514":
              tidyFrom = "Sanaë";
              break;
          }
          if(dateFormat(message.dateSent, 'isoDate') == dateFormat(Date.now(), 'isoDate')) {
            tidyDate = "Today " + dateFormat(message.dateSent, 'h:MMTT');
          } else {
            tidyDate = dateFormat(message.dateSent, 'ddd mmm dd h:MMTT');
          }
          reminders.push({
            'to': message.to, 
            'from': tidyFrom, 
            'dateSent': tidyDate, 
            'body': message.body, 
            'sid': message.sid
          });
        });
        remindersData.reminders = reminders;
        cb(remindersData);
      });
    }
  };
}