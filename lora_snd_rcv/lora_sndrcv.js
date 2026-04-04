// LoRa transmission script for Shelly
// Sends power data and virtual component values every 2 minutes
var TEL = {
    H6_PWEN:        0x11,  // periodic power and energy data
    H6_ENEXP:       0x22,  // energy export data
    H6_HEALTH:      0x33,  // health status data, wlan, ha 
    GET_H6_ENEXP:   0xaa,  // request energy export data
    GET_H6_HEALTH:  0xbb   // request health data
};

var WIFI_STATUS = {
    "got ip":       0,
    "connected":    1,
    "connecting":   2,
    "disconnected": 3,
    "unknown":      15
};

var loraBusy = false;

function uint32ToBytes(n) {
    return [
        (n >> 24) & 0xFF,
        (n >> 16) & 0xFF,
        (n >> 8) & 0xFF,
        n & 0xFF
    ];
}

function uint16ToBytes(n) {
    return [
        (n >> 8) & 0xFF,
        n & 0xFF
    ];
}

function byteToBinary(byte) {
  var b = (byte & 0xFF).toString(2);
  while (b.length < 8) {
    b = "0" + b;
  }
  return b;
}

function calculateXorChecksum(bytes) {
    var checksum = 0;
    for (var i = 0; i < bytes.length; i++) {
        checksum ^= bytes[i];
    }
    return checksum;
}

function calculateCrc8(bytes) {
    var crc = 0;
    for (var i = 0; i < bytes.length; i++) {
        crc ^= bytes[i];
        for (var j = 0; j < 8; j++) {
            if (crc & 0x80) {
                crc = (crc << 1) ^ 0x07;
            } else {
                crc = crc << 1;
            }
            crc &= 0xFF;
        }
    }
    return crc;
}

function loraSendbak(payload) {
    print("LoRa payload: " + btoa(payload));
    Shelly.call('Lora.SendBytes', {
        id: 100,
        data: btoa(payload)
    }, function (data, err, errmsg) {
        if (err) {
            print('LoRa send error:', err, errmsg);
        } else {
            //print('LoRa send success:', JSON.stringify(data)); // should print LoRa send success: null 
        }
    });
}
function loraSend(payload) {
    if (loraBusy) {
        print("LoRa busy, queuing...");
        Timer.set(3000, false, function() { loraSend(payload); }, null);
        return;
    }
    loraBusy = true;
    Shelly.call('Lora.SendBytes', { id: 100, data: btoa(payload) },
        function(data, err, errmsg) {
            loraBusy = false;
            if (err) print('LoRa send error:', err, errmsg);
        }
    );
}

function collectHealthData(callback) {
    var health = {};
    
    // get sys info (uptime etc)
    Shelly.call("Sys.GetStatus", {}, function(sys) {
        health.uptime = sys.uptime;
        
        // chain the next call
        Shelly.call("Wifi.GetStatus", {}, function(wifi) {
            health.wifiRssi   = wifi.rssi;
            health.wifiStatus = wifi.status;
            
            // chain temperature
            Shelly.call("Shelly.GetStatus", {}, function(status) {
                health.tempC = status["switch:0"].temperature.tC;
                callback(health);
            });
        });
    });
}

function getComponentValue(componentId, property, defaultValue) {
    var status = Shelly.getComponentStatus(componentId);
    if (!status) {
        print("Warning: Failed to get status for " + componentId);
        return defaultValue || 0;
    }
    
    // If property is specified, use it directly
    if (property && status[property] !== undefined) {
        return status[property];
    }
    
    // Otherwise fall back to common properties
    if (status.value !== undefined) return status.value;
    if (status.apower !== undefined) return status.apower;
    
    print("Warning: No valid property found for " + componentId);
    return defaultValue || 0;
}

function addValueToPayload(payload, value, precision, byteLength) {
    var scaled = Math.round(value * precision);
    var bytes;
    if (byteLength === 2) {
        bytes = uint16ToBytes(scaled);
    } else if (byteLength === 4) {
        bytes = uint32ToBytes(scaled);
    } else {
        throw new Error("Unsupported byte length: " + byteLength);
    }
    for (var i = 0; i < bytes.length; i++) {
        payload.push(bytes[i]);
    }
}

function sendPWENData() {
    //var pvpower = getComponentValue("switch:0", "apower");
    var rEnergy = getComponentValue("number:200", "value");
    var rPower = getComponentValue("number:201", "value");
    var rpvEnergy = getComponentValue("number:202", "value");
    var rpvPower = getComponentValue("number:203", "value");
    
    var energy = Math.ceil(Number(rEnergy) || 0);
    var power= Math.ceil(Number(rPower) || 0);
    var pvEnergy= Math.ceil(Number(rpvEnergy) || 0);
    var pvPower= Math.ceil(Number(rpvPower) || 0);
    print("sending h6pwen: " + energy + " Wh,  h6power: " + power + " W, pvEnergy: " + pvEnergy + " Wh, pvPower: " + pvPower + " W");
    
    var payload = [];
    payload.push(TEL.H6_PWEN);
    addValueToPayload(payload, energy, 1, 4); // , 100 2 decimal precision, but we have Wh, now kWh
    addValueToPayload(payload, power, 1, 2); // 0 decimal precision
    addValueToPayload(payload, pvEnergy, 1, 4); // 2 decimal precision
    addValueToPayload(payload, pvPower, 1, 2); // 0 decimal precision
    
	// to deal with data corruption, add checksum
	//var checksum = calculateXorChecksum(payload);
	var checksum = calculateCrc8(payload);
	print("  pwen bytes: " + payload.length + ", checksum: 0x" + checksum.toString(16) + ", 0b" + byteToBinary(checksum));
	payload.push(checksum);
	
    loraSend(payload);
}

function sendENEXPData() {
    var rExpEnergy = getComponentValue("number:204", "value");
    var expEnergy = Math.ceil(Number(rExpEnergy) || 0); 
    print("sending h6exp: " + expEnergy + " Wh");
    var payload = [];
    payload.push(TEL.H6_ENEXP);
    addValueToPayload(payload, expEnergy, 1, 4);

	var checksum = calculateCrc8(payload);
	print("  enexp bytes: " + payload.length + ",  checksum: 0x" + checksum.toString(16) + ", 0b" + byteToBinary(checksum));
	payload.push(checksum);

    loraSend(payload);
}

function sendHEALTHData() {
    collectHealthData(function(health) {
        var payload = [];
        payload.push(TEL.H6_HEALTH);
        addValueToPayload(payload, health.uptime, 1, 4); // uptime as uint32
        var tempByte = Math.round(health.tempC); // encode: round to nearest degree, clamp to int8 range
        if (tempByte > 127)  tempByte = 127;
        if (tempByte < -128) tempByte = -128;
        if (tempByte < 0) tempByte = tempByte + 256; 
        payload.push(tempByte);
        payload.push(health.wifiRssi);  // -127 dBm should be sufficient
        var wifiStatusByte = (WIFI_STATUS[health.wifiStatus] !== undefined) 
            ? WIFI_STATUS[health.wifiStatus] : WIFI_STATUS["unknown"];        
        payload.push(wifiStatusByte);
         
        var checksum = calculateCrc8(payload);
        print("  health bytes: " + payload.length + ",  checksum: 0x" + checksum.toString(16) + ", 0b" + byteToBinary(checksum));
        payload.push(checksum);
        loraSend(payload);
    });
}

// register lora receive handler
Shelly.addEventHandler(function(event) {
    if (event.component === "lora:100" && event.info && event.info.event === "lora_received") {
      print("LoRa frame received, rssi: " + event.info.rssi + ", snr: " + event.info.snr);

      var raw = atob(event.info.data);
      if (raw.length < 1) 
        return;
  
      var telType = raw.charCodeAt(0);
      if (telType === TEL.GET_H6_ENEXP) {
          print("enexp request received");
          sendENEXPData();
      }
      if (telType === TEL.GET_H6_HEALTH) {
          print("enexp request received");
          sendHEALTHData();
      }
      // future: handle ACK, REQ_CONFIG, REQ_RESET, etc.
    }
});
// Send immediately on script start, only health, rest with timers
//sendPWENData();
//sendENEXPData();
sendHEALTHData();

Shelly.call("Lora.GetStatus", {id: 100}, function(result) {
    print("LoRa status:", JSON.stringify(result));
});

// Schedule periodic calls, second param true means run every interation, false will run only once
print("setting periodic timers");
Timer.set(2 * 60 * 1000, true, sendPWENData, null); // very 2 min power and energy data
Timer.set(181 * 60 * 1000, true, sendENEXPData, null); // very 3 hours energy export
Timer.set(123 * 60 * 1000, true, sendHEALTHData, null); // very 2 hours health data
