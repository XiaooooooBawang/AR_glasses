import { TextEncoder } from '/encoding';
import QQMapWX from '../../utils/qqmap-wx-jssdk.js';   //引入腾讯地图sdk类
//实例化地址解析api
var qqmapsdk = new QQMapWX({
  key: 'VUABZ-6GNKP-2KODV-VFV7E-6Y4NO-BABAB'
});
var app = getApp();

//字符串（包括中文）转array
function gbkToArray(content){
  var _encoder = new TextEncoder("gb2312", {NONSTANDARD_allowLegacyEncoding: true});
  // content 需要打印的字符串
  const val = _encoder.encode(content);
  //console.log("gbkToArryval",val);
  return  val.buffer;
}
//休眠函数
/*function sleep(delay) {
  var start = (new Date()).getTime();
  while ((new Date()).getTime() - start < delay) {
      continue;
  }
}*/
//地图插件
function pluginMap(des,deslatitude,deslongitude) {
  let plugin = requirePlugin('routePlan');
  let key = 'VUABZ-6GNKP-2KODV-VFV7E-6Y4NO-BABAB';  //使用在腾讯位置服务申请的key
  let referer = 'AR眼镜地图导航';   //调用插件的app的名称 必须符合app名称
  let endPoint = JSON.stringify({  //终点 可修改
    'name': des,
    'latitude': deslatitude,  
    'longitude': deslongitude
  });
  let mode = 'walking' ;   // 模式为步行
  wx.navigateTo({
    url: 'plugin://routePlan/index?key=' + key + '&referer=' + referer + '&endPoint=' + endPoint +'&mode=' + mode
  })
}

Page({
  data: {
    destination:'',
    startlatitude:0,
    startlongitude:0,
    nowlatitude:0,
    nowlongitude:0,
    nowcompass:0
  },
  //写特征值函数
  writeBLECharacteristicValue(string) {
    let buffer=gbkToArray(string)
    wx.writeBLECharacteristicValue({
      deviceId:app.globalData.deviceId,
      serviceId: app.globalData.serviceId,
      characteristicId: app.globalData.characteristicId,
      value: buffer,
      success:(res)=>{
        console.log('writeBLECharacteristicValue success', res)
      },
      fail:(res=>{
        console.log('writeBLECharacteristicValue fail', res)
      })
    })
  },
  //页面加载成功就开启前台定位
  onLoad: function () {
    let that=this
    //获取起点定位
    wx.getLocation({
      type: 'gcj02',
      success (res) {
        that.setData({
          startlatitude:res.latitude,
          startlongitude:res.longitude
        })
        console.log
        that.writeBLECharacteristicValue('sa'+that.data.startlatitude);
        that.writeBLECharacteristicValue('sg'+that.data.startlongitude);
      }
    })
    //开启前台定位
    wx.startLocationUpdate({
      success(res) {
        console.log('开启前台定位成功', res)
      },
      fail(res) {
        console.log('开启前台定位失败', res)
      }
    })
    //开启罗盘
    wx.startCompass({
      success(res) {
        console.log('开启罗盘成功', res)
      },
      fail(res) {
        console.log('开启罗盘失败', res)
      }
    })
  },
  //页面卸载时关闭实时定位和罗盘
  onUnload: function () {
    wx.stopLocationUpdate({
      success(res) {
        console.log('关闭前台定位成功', res)
      },
      fail(res) {
        console.log('关闭前台定位失败', res)
      }
    })
    wx.stopCompass({
      success(res) {
        console.log('关闭罗盘成功', res)
      },
      fail(res) {
        console.log('关闭罗盘失败', res)
      }
    })
  },
  //开始在输入框输入
  inputDes:function (e) {
    this.setData({
      destination: e.detail.value
    })
  },
  //点击开始导航按钮获取输入内容和调用插件
  onTapButton : function () {
    var that=this
    //获取变化的定位
    wx.onLocationChange(function (res) {
      console.log("location has change!")
      that.setData({
        nowlatitude:res.latitude,
        nowlongitude:res.longitude
      })
      console.log("纬度："+that.data.nowlatitude,"经度："+that.data.nowlongitude)
      that.writeBLECharacteristicValue('na'+that.data.nowlatitude);
      that.writeBLECharacteristicValue('ng'+that.data.nowlongitude);
    })
      //获取变化的罗盘信息
    wx.onCompassChange(function(res){
      //console.log("compass has change!")
      that.setData({
        nowcompass:res.direction
      })
      //console.log("罗盘："+that.data.nowcompass)
      //.writeBLECharacteristicValue('c'+that.data.nowcompass)
    })
    //地址解析插件
    qqmapsdk.geocoder({
      address:that.data.destination ,
      success:function(res){
        console.log("成功调用地址解析接口",res)
        let latitude = res.result.location.lat;
        let longitude = res.result.location.lng;
        console.log(latitude)
        console.log(longitude)
        that.writeBLECharacteristicValue('da'+latitude);
        that.writeBLECharacteristicValue('dg'+longitude);
        that.writeBLECharacteristicValue('g');
        pluginMap(that.data.destination,latitude,longitude);
      },
      fail:function(error){
        console.log("调用地址解析接口失败",error);
      }
    })
  },
})