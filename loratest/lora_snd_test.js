// Simple LoRa test sender - sends one fixed message

function loraSendTest() {
    var testData = [0xDE, 0xAD, 0xBE, 0xEF]; // Fixed 4-byte test pattern
    
    print("Sending test LoRa message: DEADBEEF");
    
    Shelly.call('Lora.SendBytes', {
        id: 100,
        data: btoa(testData)
    }, function (data, err, errmsg) {
        if (err) {
            print('LoRa send error:', err, errmsg);
        } else {
            print('LoRa send success');
        }
    });
    
    // Check status after send
    Shelly.call("Lora.GetStatus", {id: 100}, function(result) {
        print("LoRa Status:", JSON.stringify(result));
    });
}

// Send immediately
loraSendTest();

print("Test message sent");
