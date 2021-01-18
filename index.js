var Service, Characteristic
const request = require('request')
const packageJson = require('./package.json')

module.exports = function (homebridge) {
  Service = homebridge.hap.Service
  Characteristic = homebridge.hap.Characteristic
  homebridge.registerAccessory('homebridge-http-lock-qinlin', 'HTTPLockQinLin', HTTPLockQinLin)
}

class HTTPLockQinLin {
  constructor(log, config) {
    this.log = log

    this.name = config.name

    this.manufacturer = config.manufacturer || packageJson.author.name
    this.serial = config.serial || packageJson.version
    this.model = config.model || packageJson.name
    this.firmware = config.firmware || packageJson.version

    this.timeout = config.timeout || 5000
    this.http_method = 'POST'

    this.sessionId = config.sessionId

    this.autoLock = config.autoLock || true
    this.autoLockDelay = config.autoLockDelay || 10

    this.refreshSessionTimeBuffer = config.refreshSessionTimeBuffer || 300

    this.service = new Service.LockMechanism(this.name)
  }

  static get refreshSessionURL() {
    return 'https://mobileapi.qinlinkeji.com/api/wxmini/v3/appuser/refresh'
  }

  static get openDoorURL() {
    return 'https://mobileapi.qinlinkeji.com/api/open/doorcontrol/v2/open'
  }

  identify (callback) {
    this.log('Identify requested!')
    callback()
  }

  _httpRequest (url, headers, body, method, callback) {
    request({
      url: url,
      method: this.http_method,
      timeout: this.timeout,
      rejectUnauthorized: false
    },
    function (error, response, body) {
      callback(error, response, body)
    })
  }

  setLockTargetState (value, callback) {
    var url
    var body
    var headers
    this.log('[+] Setting LockTargetState to %s', value)

    if (value === 1) {
      this.service.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED)
      this.log('[*] Closed the lock')
      return
    } else {
      var openDoorURLWithSession = HTTPLockQinLin.openDoorURL + '?sessionId=' + this.sessionId

      this._httpRequest(openDoorURLWithSession, null, '', this.http_method, function (error, response, responseBody) {
          if (error) {
            this.log('[!] Error setting LockTargetState: %s', error.message)
            callback(error)
          }
          else {
            this.service.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.UNSECURED)
            this.log('[*] Opened the lock')
          }
      }.bind(this))

      if (this.autoLock) {
        this.autoLockFunction()
      }

      callback()
    }
  }

  refreshSession () {
    var refreshSessionURLWithSession = HTTPLockQinLin.refreshSessionURL + '?sessionId=' + this.sessionId

    this._httpRequest(refreshSessionURLWithSession, null, '', this.http_method, function (error, response, responseBody) {
        if (error) {
          this.log('[!] Error refreshing session: %s', error.message)
        }
        else {
          var result = JSON.parse(responseBody)
          if (result.code === 0) {
            this.sessionId = result.data.sessionId
            this.log('[*] Refreshed Session: %s', this.sessionId)

            setTimeout(() => {
              this.refreshSession()
            }, (result.data.expires - this.refreshSessionTimeBuffer) * 1000)
          }
        }
    }.bind(this))
  }

  autoLockFunction () {
    this.log('[+] Waiting %s seconds for autolock', this.autoLockDelay)
    setTimeout(() => {
      this.service.setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED)
      this.log('[*] Autolocking')
    }, this.autoLockDelay * 1000)
  }

  getServices () {
    this.service.setCharacteristic(Characteristic.LockCurrentState, Characteristic.LockCurrentState.SECURED)
    this.service.setCharacteristic(Characteristic.LockTargetState, Characteristic.LockTargetState.SECURED)

    this.informationService = new Service.AccessoryInformation()
    this.informationService
      .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
      .setCharacteristic(Characteristic.Model, this.model)
      .setCharacteristic(Characteristic.SerialNumber, this.serial)
      .setCharacteristic(Characteristic.FirmwareRevision, this.firmware)

    this.service
      .getCharacteristic(Characteristic.LockTargetState)
      .on('set', this.setLockTargetState.bind(this))

    this.refreshSession()

    return [this.informationService, this.service]
  }

}
