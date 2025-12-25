# lora tests

## setup
- make sure both shelly have the Add-on on the left menu in the web interface
- set the Add-on to LoRa Add-on
- configure BOTH addons to the same paramters
  -- have the shelly a few meters apart and select the Balanced Preset
- enable the Lora receive feature on both
- it is ok if both shelly have the LoRa Add-on at id 100

## script setup
add both scripts lora_snd_test.js to each shelly.
that way you can have both be sender and receiver

## tests
- run the receiver script on one shelly, then snd on the other
- check a) the console output in Scripts section of the Web interface, then select the script to run and b) also the Sent and Received byte counts in the Add-on section of the Web interface
- it took me a few tries, had the two shellies only 30 cm apart originally, send wrould work but not recieve, then i swapped roles and eventually i got data on both
