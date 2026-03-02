// LoRa transmission script for Shelly
// Sends power data and virtual component values every 2 minutes

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

function loraSend(payload) {
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

function sendLoraData() {
    //var pvpower = getComponentValue("switch:0", "apower");
    var renergy = getComponentValue("number:200", "value");
    var rpower = getComponentValue("number:201", "value");
    var rpvEnergy = getComponentValue("number:202", "value");
    var rpvPower = getComponentValue("number:203", "value");
    
    var energy = Math.ceil(Number(renergy) || 0);
    var power= Math.ceil(Number(rpower) || 0);
    var pvEnergy= Math.ceil(Number(rpvEnergy ) || 0);
    var pvPower= Math.ceil(Number(rpvPower ) || 0);
    
    print("sending h6energy: " + energy + " Wh,  h6power: " + power + " W, pvEnergy: " + pvEnergy + " Wh, pvPower: " + pvPower + " W");
    
    var payload = [];
    addValueToPayload(payload, energy, 1, 4); // , 100 2 decimal precision, but we have Wh, now kWh
    addValueToPayload(payload, power, 1, 2); // 0 decimal precision
    addValueToPayload(payload, pvEnergy, 1, 4); // 2 decimal precision
    addValueToPayload(payload, pvPower, 1, 2); // 0 decimal precision
    
	// to deal with data corruption, add checksum
	//var checksum = calculateXorChecksum(payload);
	var checksum = calculateCrc8(payload);
	print("  checksum: 0x" + checksum.toString(16) + ", 0b" + byteToBinary(checksum));
	payload.push(checksum);
	
    loraSend(payload);
}

// Send immediately on script start
sendLoraData();

Shelly.call("Lora.GetStatus", {id: 100}, function(result) {
    print("Sender LoRa Status:", JSON.stringify(result));
});

// Schedule to run every 5 minutes (300000 ms)
var repeatMin = 2;
Timer.set(repeatMin * 60 * 1000, true, sendLoraData, null);

print("LoRa transmission scheduled every " + repeatMin + " minutes");
