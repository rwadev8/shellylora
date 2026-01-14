// LoRa reception script for Shelly Gen4
// Receives power data and virtual component values

//print("=== LoRa Receiver Script Loading ===");

function bytesToUint32(bytes, offset) {
    return (bytes[offset] << 24) | 
           (bytes[offset + 1] << 16) | 
           (bytes[offset + 2] << 8) | 
           bytes[offset + 3];
}

function bytesToUint16(bytes, offset) {
    return (bytes[offset] << 8) | bytes[offset + 1];
}

// Calculate 1-byte XOR checksum
// `bytes` should be an array of numbers (0–255)
function calculateXorChecksum(bytes) {
    var checksum = 0;
    for (var i = 0; i < bytes.length; i++) {
        checksum ^= bytes[i];  // XOR each byte
    }
    return checksum; // & 0xFF;   // ensure 8-bit result
}

function asyncPrint(msg) {
    Timer.set(1, false, function() {
        print(msg);
    }, null);
}

function parseLoraPayload(data) {
    var decoded = atob(data);
    var bytes = [];
    for (var i = 0; i < decoded.length; i++) {
        bytes.push(decoded.charCodeAt(i));
    }
    
    if (bytes.length !== 13) {
        asyncPrint("Warning: Unexpected payload length: " + bytes.length + " bytes");
        return null;
    }
    else {
      asyncPrint("received telegram: " + data + "   length: " + bytes.length + " bytes");
    }
    
    var energy = bytesToUint32(bytes, 0) / 1;
    var power = bytesToUint16(bytes, 4) / 1;
    var pvEnergy = bytesToUint32(bytes, 6) / 1;
    var pvPower= bytesToUint16(bytes, 10) / 1;
    var receivedCS = bytes[12];
    var dataBytes = bytes.slice(0, 12);
    var calcCS = calculateXorChecksum(dataBytes);
    
    if (receivedCS !== calcCS) {
      asyncPrint("Error: checksum missmatch,  received: " + receivedCS + "  calc: " + calcCS);
      return null;
    }
    
    // bug in packing, the house power can be negative if we feed into the grid, assume that we can not import more then 32 kW 
    // make sure to also allow negative value in the shelly virtual components
    if (power & 0x8000) {  // 0x8000 = 32768 = binary 1000000000000000
        power = power - 65536;
    }
    if (pvPower & 0x8000) {
        pvPower = pvPower - 65536;
    }
   
    asyncPrint("rcv parsed h6energy: " + energy + " Wh, h6power: " + power + " W, h6pvenergy: " + pvEnergy + " Wh, h6pvpower: " + pvPower + " W");
    
    return {
        h6energy: energy,
        h6power: power,
        h6pvenergy: pvEnergy,
        h6pvpower: pvPower
    };
}

Shelly.addEventHandler(function(event) {
    if (event.component === "lora:100" && event.info && event.info.event === "lora_received") {
        asyncPrint("LoRa frame received, RSSI: " + event.info.rssi + ", SNR: " + event.info.snr);
        
        var parsed = parseLoraPayload(event.info.data);
        
        if (parsed) {
            updateVirtualComponent(200, parsed.h6energy);
            updateVirtualComponent(201, parsed.h6power);
            updateVirtualComponent(202, parsed.h6pvenergy);
            updateVirtualComponent(203, parsed.h6pvpower);
        }
    }
});

function updateVirtualComponent(componentId, value) {
    Shelly.call("Number.Set", {
        id: componentId,
        value: value
    }, function(result, error_code, error_message) {
        if (error_code !== 0) {
            print("Error updating " + componentId + ": " + error_message);
        } else {
            //print("Updated " + componentId + " = " + value);
        }
    });
}

// Register LoRa receive handler
//print("Registering LoRa event handler...");
print("LoRa receiver script started - waiting for frames...");

// manual test in cosole Shelly.call("Lora.GetStatus", {id: 100}, function(result, error_code, error_message) {
//    print("LoRa Status:", JSON.stringify(result));
//});

/* Based on what we've seen in the logs, event.info contains:
event: "lora_received"
data: Base64 encoded payload
rssi: Signal strength in dBm (e.g., -64)
snr: Signal-to-noise ratio in dB (e.g., 9)
ts: Timestamp when received
tsu: Time since update (appears to be microseconds)
component: "lora:100"
id: 100 (the LoRa addon ID)  */
