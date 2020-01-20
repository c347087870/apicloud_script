var request = require('request');
var Cookie = require('./cookie');
function getapplist(fun){
    var options = {
        'method': 'POST',
        'url': 'https://www.apicloud.com/getAllAppByUser',
        'headers': {
          'Host': 'www.apicloud.com',
          'Origin': 'https://www.apicloud.com',
          'Referer': 'https://www.apicloud.com/package',
          'Cookie': Cookie
        }
      };
      request(options, function (error, response) { 
        if (error) throw new Error(error);
        fun(response.body)
        
      });
}
  module.exports = getapplist