# homebridge-http-qinlin

## Description

This plugin [homebridge](https://github.com/nfarina/homebridge) uses the Qinlin Wechat Miniprogram API to open doors.

## Installation

1. Install [homebridge](https://github.com/nfarina/homebridge#installation-details)
2. Install this plugin: `npm install -g homebridge-http-lock-qinlin`
3. Update your `config.json` file

## Configuration examples
Configuration example for a Shelly 1 device controlled via Get Requests in local network. Resets it's state to locked automatically after 5 Seconds

```json
"accessories": [
     {
      "accessory": "HTTPLockQinLin",
      "name": "Front Door",
      "sessionId": "2c9a195976f6edc5017715ba89c73fb3"
      }
]
```
