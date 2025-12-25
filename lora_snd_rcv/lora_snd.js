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
    var energy = getComponentValue("number:200", "value");
    var power = getComponentValue("number:201", "value");
    var pvEnergy = getComponentValue("number:202", "value");
    var pvPower = getComponentValue("number:203", "value");
    
    print("sending h6energy: " + energy + " Wh,  h6power: " + power + " W, pvEnergy: " + pvEnergy + " Wh, pvPower: " + pvPower + " W");
    
    var payload = [];
    addValueToPayload(payload, energy, 1, 4); // , 100 2 decimal precision, but we have Wh, now kWh
    addValueToPayload(payload, power, 1, 2); // 0 decimal precision
    addValueToPayload(payload, pvEnergy, 1, 4); // 2 decimal precision
    addValueToPayload(payload, pvPower, 1, 2); // 0 decimal precision
    
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
