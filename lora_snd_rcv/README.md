# lora send and receive scripts

same as for the test scripts, my suggestion would be to get data send using those first.
the lora_snd.js take data from virtual components and sends them, the receiver takes the data and saves them in virtual components on the receiving shelly.
the new lora_sndrcv.js is meant to be used with the esp32p4 lora receiver

## notes
- try to pack the data as much as possible, to say below the 1% lora air time convention
- somehow print() and console.log() would not work on the receiving side, no idea why. got the idea for the workaround from chatgpt
- noticed that the receiver script once in a while with an unknown error, probably need to harden the receiver script
- have had a fair amount of data spikes, will add a checksum to verify data
