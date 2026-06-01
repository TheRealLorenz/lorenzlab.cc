+++
title = "The Red DisAster"
date = 2026-05-29
+++

The RedAster was supposed to launch on _29 mag 2026_. For a series of unfortunate events, the launch was **cancelled**, but we didn't give up. Thanks to the guys at [DARE](https://dare.tudelft.nl/), we still underwent the **rocket check**, a standard procedure for rocket verification before every launch. Other than performing the check itself, they provided really useful **design advice** for the rocket itself and for the **EuRoC competition**.

In a way, that was a **reality check**. So we decided to take a step back and make a **review** of the rocket design.

I'm the software lead, but embedded software developing requires a good comprehension of the platform you're programming on, so my review will cover anything from hardware to software of our _stack_.

---

## Hardware

### What's now

Our _stack_ is comprised of 4 boards:

- MCU board:
  It's the main brain of the _stack_. It houses an STM32H7, a Cortex microcontroller, which is pretty **beefy** (runs @ 550MHz).
  The H7 has several SPI channels, I2C, UART/USART, two DMA controllers with 7 channels each, all of this allow to have **lot of peripherals** connected and orchestrated as **fast** as possible.
  The board also features an external 48 MHz **oscillator**, **tempererature and pressure** sensor (MS5611), an **IMU** (BMI088), led indicators, buttons and more.

- Sensor board:
  It's a **dumb** board, meaning that it doesn't house a microcontroller, but it's just an extension of the MCU board itself. It contains **lots of sensors**, some that are **redundancies** of MCU sensors (even with multiple redundancies), while others are sensor which do not appear in the main board, like the differential pressure sensor used for the **Pitot tube**.

- Power board:
  It's responsible for handling the **battery**, a 3S LiPo (about 11.6v), and houses all the **voltage regulators** for the entire _stack_, each paired with a current, voltage and power sensors (INA219).
  The board also has all the connections with rocket itself (servo connectors, pyro connectors, ring board connector), which are all wired to the MCU board. In addition, it also has JTAG connectors to program the MCU and Telemetry boards, as they both house a microcontroller.

- Telemetry board:
  It's the LoRa (Long Range) relay of the _stack_. **LoRa** is a technology that enables long range communication, up to **3 Km** without breaking a sweat.
  The board **bridges LoRa and the MCU** board via UART, forwarding each side's traffic to the other.
  It makes all of this using an STM32L4.


The stack is held together with connectors and lots of screws. Power gets cut with an **Allen key** (for safety).

### What's wrong

**The system is too complex.**

The stack needs a faster way to be fastened to the rocket, now the stack needs to be taken apart and put together again with screws. The internal connections are delicate.

Some peripherals were bound to the wrong bus (SPI/I2C/UART), based on the one that then appeared to be more convenient. Servomotors connections are *non-standard* and that's inconvenient, but even if they were standard, they could be plugged upside down.

The battery connector is a hassle to connect and disconnect if it's not held tightly, as it was inconvenient to disconnect when the stack was mounted on its support. Using an Allen key as a power switch is really uncomfortable during development.

We probably don't need all of this copy of sensors (1 is plenty, 2 is almost too much), as the system already provides software redundancy with timers and the active control algorithm itself. We probably don't need all of the sensors in general.

Is the arm switch wired? (Hope so). The power switch is not externally accessible. Servos cannot be easily connected to the CATS vega (we would need to fit 4). Do we need a breakwire?

Cables need to have better connectors.

### What's next

We'll see!

---

## Software

### What's now

There are two microcontrollers on the _stack_, so each one gets its own firmware.

The software is built using **Zephyr RTOS** in C, which is an embedded OS under the _Linux Software Foundation_. It leverages `.dts` files (Device Tree Source) for hardware description, and provides a set of tool and library which **simplify software development**, at the cost of being fairly **complicated to tackle at first**.

The Telemetry board leverages DMAs to allow for **asynchronous transfer** to peripherals, making the bridging from LoRa to UART as fast and efficient as possible. The LoRa and UART peripherals are actually wrapped using the Mavlink serializer, which is a transport layer library, that will be further discussed later. The telemetry board so deserializes `mavlink_message_t`s and forwards them to the corresponding peripheral by reserializing them. This is useful to have the Telemetry board communicate to ground too, for sending telemetry stats and whatnot.

The MCU onboard software is built around a state machine that's being used to allow better code separation. There's also a state machine for the flight, which identifies different flight stages and acts accordingly.

During flight we the RTIO framework, which automatically manages concurrent access to peripherals, which allows us to have readings every 2.5ms, which should be fine to run a simulation at 100Hz (every 10ms), which is a requirement from the controls department.

The MCU board mantains a lower power state while in idle, and waits for an `ARM` command in addition to the removal of the safety pin to switch to the **armed mode**. Whenever armed, an acceleration based detection is used to detect liftoff and start the flight control algorithm.

### What's Wrong

The system is too complex.

There's no need for state management during pre flight, it's just useless and adds unnecessary complexity. Software arming (in addition to physical arming), is also unnecessary, the charger will be plugged in on the ramp, so electric consumption. It's also a weaker link of the chain, because a simple interfence may cause the rocket to simply not start the control algorithm!

Code is not so well organized, we've rushed the last couple of weeks.

It's hard for non avionics people to use the board, just for testing. There should be debug applications (like the one for servos), or even a debug section in the actual application which could be accessed by 3rd parties.

LEDs are almost ignored, as they're difficult to identify, some are burnt and whatnot. We're not using the ring lights, but they're plenty useful and NEED to be implemented for an actual launch.

There's no actual code for the scheduling, flight control and safety timers.

### What's next

We need to add some high priority timers which run at the start of the flight, which dictate the deadlines and should account for any software or control function bug or issue.

## Other

We'll see!
