//获取应用实例
var  app = getApp()
function inArray(arr, key, val) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i][key] === val) {
      return i;
    }
  }
  return -1;
}
Page({
  data: {
    devices: [],
    connected: false,
    chs: [],
  },
  openBluetoothAdapter:function() {
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('openBluetoothAdapter success', res)
        this.startBluetoothDevicesDiscovery()
      },
      fail: (res) => {
        if (res.errCode === 10001) {
          wx.onBluetoothAdapterStateChange(function (res) {
            console.log('onBluetoothAdapterStateChange', res)
            if (res.available) {
              this.startBluetoothDevicesDiscovery()
            }
          })
        }
      }
    })
  },
  getBluetoothAdapterState() {
    wx.getBluetoothAdapterState({
      success: (res) => {
        console.log('getBluetoothAdapterState', res)
        if (res.discovering) {
          this.onBluetoothDeviceFound()
        } else if (res.available) {
          this.startBluetoothDevicesDiscovery()
        }
      }
    })
  },
  startBluetoothDevicesDiscovery() {
    if (this._discoveryStarted) {
      return
    }
    this._discoveryStarted = true
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      success: (res) => {
        console.log('startBluetoothDevicesDiscovery success', res)
        this.onBluetoothDeviceFound()
      },
    })
  },
  stopBluetoothDevicesDiscovery:function() {
    wx.stopBluetoothDevicesDiscovery({
      success:(res)=>{
        console.log('stopBluetoothDevicesDiscovery success',res)
      },
    })
  },
  onBluetoothDeviceFound() {
    wx.onBluetoothDeviceFound((res) => {
      res.devices.forEach(device => {
        if (!device.name && !device.localName) {
          return
        }
        const foundDevices = this.data.devices
        const idx = inArray(foundDevices, 'deviceId', device.deviceId)
        const data = {}
        if (idx === -1) {
          data[`devices[${foundDevices.length}]`] = device
        } else {
          data[`devices[${idx}]`] = device
        }
        this.setData(data)
      })
    })
  },
  createBLEConnection:function(e) {
    const ds = e.currentTarget.dataset
    const deviceId = ds.deviceId
    const name = ds.name
    wx.createBLEConnection({
      deviceId,
      success: (res) => {
        console.log('createBLEConnection success',res)
        console.log("deviceId is"+deviceId )
        this.setData({
          connected: true,
          name,
          deviceId,
        })
        this.getBLEDeviceServices(deviceId)
      },
      fail:(res)=>{
        console.log('createBLEConnection fail',res)
      }
    })
    this.stopBluetoothDevicesDiscovery()
  },
  closeBLEConnection:function() {
    wx.closeBLEConnection({
      deviceId: this.data.deviceId,
      success:(res)=>{
        console.log("closeBLEConnection success",res)
      }
    })
    this.setData({
      connected: false,
      chs: [],
      canWrite: false,
    })
  },
  getBLEDeviceServices(deviceId) {
    wx.getBLEDeviceServices({
      deviceId,
      success: (res) => {
        console.log('device all services: ',res.services)
        for (let i = 0; i < res.services.length; i++) {
          if (res.services[i].isPrimary) {
            this.getBLEDeviceCharacteristics(deviceId, res.services[i].uuid)
            return
          }
        }
      }
    })
  },
  getBLEDeviceCharacteristics(deviceId, serviceId) {
    wx.getBLEDeviceCharacteristics({
      deviceId,
      serviceId,
      success: (res) => {
        console.log('getBLEDeviceCharacteristics success: ', res.characteristics)
        for (let i = 0; i < res.characteristics.length; i++) {
          let item = res.characteristics[i]
          if (item.properties.read) {
            console.log('设备支持特征值read')
            wx.readBLECharacteristicValue({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
              success:(res)=>{
                console.log('readBLECharacteristicValue succes ',res)
              }
            })
          }
          else{
            console.log('设备不支持特征值read')
          }
          if (item.properties.write) {
            console.log('设备支持特征值write')
            this.setData({
              canWrite: true
            })
            app.globalData.deviceId=deviceId
            app.globalData.serviceId=serviceId
            app.globalData.characteristicId=item.uuid
          }
          else{
            console.log('设备不支持特征值write')
          }
          if (item.properties.notify) {
            console.log('设备支持特征值notify')
            wx.notifyBLECharacteristicValueChange({
              deviceId,
              serviceId,
              characteristicId: item.uuid,
              state: true,
              success:(res)=>{
                console.log('notifyBLECharacteristicValueChange success',res)
              }
            })
          }
          else{
            console.log('设备不支持特征值notify')
          }
        }
      },
      fail(res) {
        console.error('getBLEDeviceCharacteristics error:', res)
      }
    })
  },
  closeBluetoothAdapter:function() {
    wx.closeBluetoothAdapter({
    success:(res)=>{
      console.log("closeBluetoothAdapter success ",res)
      this._discoveryStarted = false
    },
    fail:(res)=>{
      console.log("closeBluetoothAdapter fail ",res)
    }
  })
  },
})


