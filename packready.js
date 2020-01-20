var request = require('request');
var Cookie = require('./cookie');
function packready(fun){
    // 准备1
    var options = {
        'method': 'GET',
        'url': 'https://www.apicloud.com/pkgAgreement',
        'headers': {
          'Host': 'www.apicloud.com',
          'Referer': 'https://www.apicloud.com/package',
          'Cookie': Cookie
        }
      };
      request(options, function (error, response) { 
        if (error) throw new Error(error);
        packready2(fun)
        
      });
}
function packready2(fun){
    // 准备2
    var options = {
        'method': 'GET',
        'url': 'https://www.apicloud.com/api/user/experience/state',
        'headers': {
          'Host': 'www.apicloud.com',
          'Referer': 'https://www.apicloud.com/package',
          'Cookie': Cookie
        }
      };
      request(options, function (error, response) { 
        if (error) throw new Error(error);
        fun('ready')
      });
}
  module.exports = packready