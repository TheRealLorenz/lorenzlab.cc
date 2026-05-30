+++
title = "The Red DisAster"
date = 2026-05-29
+++

The RedAster was supposed to launch on _29 mag 2026_. For a series of unfortunate events, the launch was **cancelled**, but we didn't give up. Thanks to the guys at [DARE](https://dare.tudelft.nl/), we still underwent the **rocket check**, a standard procedure for rocket verification before every launch. Other than performing the check itself, they provided really useful **design advice** for the rocket itself and for the **EuRoC competition**.

In a way, that was a **reality check**. So we decided to take a step back and make a **review** of the rocket design.

Our rocket design has been split like so:

- Structure
- Recovery
- Avionics

I'm the lead of software, but embedded software developing requires a good comprehension of the platform you're programming to, so my review will cover anything from hardware to software of the _Stack_.

---

## Hardware

### What's now

There's a stack of 4 boards, namely Power, Sensor, MCU, and Telemtry. The stack is held together with connectors and screws. The stack has internal connections, which make the STM32H7 connect to all peripherals via SPI, I2C, and UART. Peripherals are located across the entire stack, and of the is the Telemetry boards itself, which runs a STM32L4.

The stack has connectors which allows the connections of external devices, such as servomotors, pyro charges, the ring board, and the ogiva board. The entire stack is powered through a 3S LiPo battery, which connects to the Power board through a connector (TODO: name? useful for later). Power gets cut with an Allen key.

Servo wiring is consistent with previous iteration, so it's *non-standard*. Loads of sensors, often with redundancies, sometimes even with different models that to the same thing. The power contains two connectors to program the MCU and Telemetry.

### What's wrong

The system is too complex.

The stack needs a faster way to be fastened to the rocket, now the stack needs to be taken apart and put together again with screws. The internal connections are delicate.

Some peripherals were bound to the wrong bus (SPI/I2C/UART), based on the one that then appeared to be more convenient. Servomotors connections are *non-standard* and that's inconvenient, but even if they were standard, they could be plugged upside down.

The battery connector is a hassle to connect and disconnect if it's not held tightly, as it was inconvenient to disconnect when the stack was mounted on its support. Using an Allen key as a power switch is really uncomfortable during development.

We probably don't need all of this copy of sensors (1 is plenty, 2 is almost too much), as the system already provides software redundancy with timers and the active control algorithm itself. We probably don't need all of the sensors in general.

Is the arm switch wired? (Hope so). The power switch is not externally accessible. Servos cannot be easily connected to the CATS vega (we would need to fit 4). Do we need a breakwire?

Cables need to have better connectors.

### What's next

TODO!

---

## Software

### What's now

The onboard software is built around a state machine that's being used to allow better code separation. There's also a state machine for the flight, which identifies different flight stages and acts accordingly.

The software is built using Zephyr RTOS, which is an embedded OS under the Linux foundation. It leverages the RTIO framework, which automatically manages concurrent access to peripherals, which allows us to have readings every 2.5ms, which should be fine to run a simulation at 100Hz (10ms period).

The control algorithm (which is still WIP), should run in the remaining 7.5ms, There's no particular scheduling, it's just a fixed scheduler during flight, centered on the control algorithm.

Software arming (in addition to hardware pin extraction), is used to maintain a lower consumption state until the actual flight.

### What's Wrong

The system is too complex.

There's no need for state management during pre flight, it's just useless and adds unnecessary complexity. Software arming (in addition to physical arming), is also unnecessary, the charger will be plugged in on the ramp, so electric consumption. It's also a weaker link of the chain, because a simple interfence may cause the rocket to simply not start the control algorithm!

Code is not so well organized, we've rushed the last couple of weeks.

It's hard for non avionics people to use the board, just for testing. There should be debug applications (like the one for servos), or even a debug section in the actual application which could be accessed by 3rd parties.

LEDs are almost ignored, as they're difficult to identify, some are burnt and whatnot. We're not using the ring lights, but they're plenty useful and NEED to be implemented for an actual launch.

### What's next

TODO!

## Other

TODO!
