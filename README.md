# shellylora
example of using shelly lora addon to transfer data over non wifi/zigbee distances

## background
The situation: imagine a small pv system at a remote site with no internet or decent mobile access (a classic first world problem, not meant irconically). and imagine one would like to see some basic data, for monitoring, in a remote HA instance.

The attempt:
- power is available
- the pv power is measured with a shelly plug
- the site has a shelly pro 3em meter to provide data
- use a shelly with a lora addon to transmit the data remotely
- the remote site has HA running, try to get the data in there
  
## setup
- shelly plug s, 2nd gen between local power and the pv inverter
- shelly pro 3em in power distribution panel
- local wlan
- local: add a shelly 1pm gen 4 with lora addon
- remote: add a shelly 1 gen 4 with lora addon

### why not use the local chirpstack or e.g. a arduino mkr1310 to receive the lora data
well, it inital idea was to use the local lorawan gateway to receive the data and send to mqtt. Problem is the knot8 does not support pure lora data at the same time it processes lorawan data, and lorawan data is being processed. the mkr1310 only has lora, no wifi. should anybody have an idea how to get the knot8 to receive and push the data to mqtt, do let me know.
due to the limitations the solution was to use a second lora addon module at the remote/receiving site.

## problems

### lora signal strength
- had problem receiving data, even using SF12
- move the receiving shelly higher
- seem to be able to get data even with     LoRa frame received, RSSI: -118, SNR: -11

### bad value filtering
- had some random data errors, therefore added some filtering of the data, also added the stat_h6_pv_power_err sensor to get an idea how often the issue occurs

## disclaimer
got a lot of help from claude and chatgpt to iron out the details, and as usual also a runaround once in a while, but once you have gotten a feel for where there current issues lie (tailspin ;-) they can be of great help.
