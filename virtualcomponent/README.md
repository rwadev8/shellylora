# Shelly Virtual Components

In order to be able to send data via the LoRa interface, collect the data from other Shelly devices and save them in virtual components. That way the LoRa code can easily acccess the data to be sent.
The same is being done on the receiving end, so that Shelly also needs to have virutal components. The Data of those are then saved via template sensors in HA.

## notes

- the Unit of the virtual component will be useful in the shelly integration, but the automatically created number. entity in HA will not have that unit nor can it be used for statistics.
- to be able to get statistics in HA, define template sensor for them
- make sure that for power components to allow for negative numbers, feed in are normally negative numbers in aenergy

## Example

<img width="1401" height="840" alt="shelly virtual component" src="https://github.com/user-attachments/assets/6a04d055-7dcd-40e2-96a8-816d0b0c2d67" />
