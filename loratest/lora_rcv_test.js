// Simplified receiver - log EVERYTHING
Shelly.addEventHandler(function(event) {
    print("=== ANY EVENT ===");
    print(JSON.stringify(event));
    print("================");
});

print("Logging ALL events - receiver ready");

/* example lora frame
=== ANY EVENT ===
13:36:36 {"component":"lora:100","name":"lora","id":100,"now":1766406996.22051811218,"info":{"component":"lora:100","id":100,"event":"lor
13:36:36 a_received","ts":1766406996.22000002861,"data":"3q2+7w==","rssi":-67,"snr":9,"tsu":1206076147}}
*/
