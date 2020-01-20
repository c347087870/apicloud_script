var request = require('request');
var getapplist = require('./getapplist'); //获取所有appid列表
var packready = require('./packready'); //打包前的准备
var Cookie = require('./cookie');       //cookie
var config = require('./config');       //配置文件    
var fs = require('fs');
// 先获取所有平台id 和 名称
var appidlist = [];  //所有apiid
var packindex = 0;   //当前执行到第几个   
var packinfo = {};   //当前打包的信息
getapplist(function (res) {
    var data = JSON.parse(res);
    if (data.status == 1) {
        appidlist = data.body;
    }
    ready()
})
function ready(){
    if(packindex>=appidlist.lnegth){
        console.log('全包打包成功')
        return;
    }
    // 是否跳过
    if(config.filter.includes(appidlist[packindex].appId)){
        // 判断是否过滤
        packindex+=1;
        ready();
        return;
    }

    
    // 打包准备
    packready(function (e) {
        // 执行打包
        console.log(appidlist[packindex].appName+e)
        packapk()
    })
}

function packapk() {
    // 获取打包信息
    var options = {
        'method': 'GET',
        'url': 'https://www.apicloud.com/getPKG?appId=' + appidlist[packindex].appId,
        'headers': {
            'Host': 'www.apicloud.com',
            'Referer': 'https://www.apicloud.com/package',
            'Cookie': getCookie()
        },
        formData: {
            appId: appidlist[packindex].appId
        }
    };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        var _thisapk = JSON.parse(response.body);
        packinfo = _thisapk.body;
        addunpack(_thisapk.body);
    });

}

function addunpack(apk) {
    var options = {
        'method': 'POST',
        'url': 'https://www.apicloud.com/addUnpack',
        'headers': {
            'Host': 'www.apicloud.com',
            'Referer': 'https://www.apicloud.com/package',
            'Cookie': getCookie()
        },
        formData: {
            'appId': appidlist[packindex].appId,
            'appName': apk.appName,
            'appEnName': '',
            'version': getpkgVer(apk.pkgVer),
            'verCode': apk.verCode+=1,
            'verType': '0',
            'platform': '0',
            'engine': '1.3.40',
            'ios_cer_type': '1',
            'powers': apk.powers.join(','),
            'iosDevice': '1',
            'isWatch': '0',
            'security': '0',
            'jsZip': '0',
            'buildVersion': '0.0.1',
            'tdSelect': apk.td_channel.tdSelect,
            'isTDChannel': '0',
            'timepicker': new Date().getTime(),
            'ios_perm[NSCameraUsageDescription]': '',
            'ios_perm[NSMicrophoneUsageDescription]': '',
            'ios_perm[NSPhotoLibraryUsageDescription]': '',
            'ios_perm[NSContactsUsageDescription]': '',
            'ios_perm[NSLocationWhenInUseUsageDescription]': '',
            'ios_perm[NSLocationAlwaysUsageDescription]': '',
            'ios_perm[NSLocationAlwaysAndWhenInUseUsageDescription]': '',
            'ios_perm[NSBluetoothPeripheralUsageDescription]': '',
            'ios_perm[NSBluetoothAlwaysUsageDescription]': '',
            'ios_perm[NSCalendarsUsageDescription]': '',
            'ios_perm[NSHealthShareUsageDescription]': '',
            'ios_perm[NSHealthUpdateUsageDescription]': '',
            'ios_perm[NSHomeKitUsageDescription]': '',
            'ios_perm[NSMotionUsageDescription]': '',
            'ios_perm[NSRemindersUsageDescription]': '',
            'ios_perm[NSSiriUsageDescription]': '',
            'ios_perm[NSSpeechRecognitionUsageDescription]': '',
            'ios_perm[NSAppleMusicUsageDescription]': '',
            'ios_perm[NSPhotoLibraryAddUsageDescription]': '',
            'ios_perm[NFCReaderUsageDescription]': '',
            'ios_perm[NSFaceIDUsageDescription]': '',
            'androidBetaEngine': '1',
            'debug': '0',
            'remark': ''
        }
    };
    request(options, function (error, response) {
        if (error) throw new Error(error);
        var _body = JSON.parse(response.body)
        getPKGState(_body.body.pkgId)
    });
}

var time = null;
// 轮询调用结果
function getPKGState(pkgId){
    time = setInterval(function(){
        var options = {
            'method': 'POST',
            'url': 'https://www.apicloud.com/getPKGState',
            'headers': {
              'Host': 'www.apicloud.com',
              'Referer': 'https://www.apicloud.com/package',
              'Cookie': getCookie()
            },
            formData: {
                'appId': appidlist[packindex].appId,
                'pkgId':pkgId,
                'platform':0
            }    
          };
          request(options, function (error, response) { 
            if (error) throw new Error(error);
            
            var _data = JSON.parse(response.body);
            if(_data.body.status==1){
                var stream = fs.createWriteStream('./ios/'+appidlist[packindex].appName+'_'+packinfo.pkgVer.replace(/\./g, "")+'.ipa');
                request(_data.body.ipaUrl).pipe(stream).on('close', function(){
                    clearInterval(time);
                    console.log(appidlist[packindex].appName+'下载完成');
                    packindex+=1;
                    ready();
                });   
            }else if(_data.body.status==10){
                console.log(appidlist[packindex].appName+'打包失败');
                clearInterval(time);
                packindex+=1;
                ready();
            }else if(_data.body.status==-2){
                console.log(`${appidlist[packindex].appName}打包中,排队${_data.body.index}`);
            }else{
                console.log(response.body);
            }
          });
    }, 5000);
}

function isloop(){
    
}

// 过滤版本号
function getpkgVer(e){
    var _ver = e.split('.');
    for(var i=0;i<_ver.length;i++){
        _ver[i] = ~~_ver[i];
    }
    if(_ver[2] < 99){
        _ver[2]+=1;
    }else if(_ver[1] < 99){
        _ver[1]+=1;
    }else if(_ver[0] < 99){
        _ver[0]+=1;
    };
    return _ver.join('.')
}

// 获取cookie
function getCookie(){
    var _CookieList = Cookie.split(';');
    for(var i=0;i<_CookieList.length;i++){
        if(_CookieList[i].split('=')[0].replace(/\s+/g,"")=='curAppId'){
            _CookieList[i] = ' curAppId='+appidlist[packindex].appId;
        }
        if(_CookieList[i].split('=')[0].replace(/\s+/g,"")=='curAppName'){
            _CookieList[i] = ' curAppName='+encodeURI(appidlist[packindex].appName+' *');
        }
    }
    return _CookieList.join(';')
}