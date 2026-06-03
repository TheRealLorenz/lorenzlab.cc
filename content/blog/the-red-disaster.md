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

The _stack_ needs a faster way to be fastened to the rocket, now the only way to put screws through the _stack_ requires it to be **taken apart** and put together again. Also, the main **connectors** of the stack are quite **delicate**.

Some peripherals were bound to the **wrong bus** (SPI/I2C/UART), given that we have access to a lot of drivers code from the Zephyr RTOS. Servomotors connections are **non-standard** and that's inconvenient, but even standard connection do **not prevent backward connections**, they just don't blow up anything if it accidentally happens. It's important to prevent wrong connections, as assembling a rocket under pressure may easily lead to errors that may have been **prevented with a better design**.

The battery connector is a **hassle to connect and disconnect** if it's not held tightly, but it's just a matter of having a longer cable that can be gripped properly. Using an Allen key as a power switch is really **uncomfortable** during development.

The **don't need all of these sensors**, but that's something that needs to be discussed. The _CATS Vega_ has a quite small subset of sensors and it's an industry standard. There are alreay plans to provide a software fallback using timer (as it's probably done in the _CATS Vega_).

The power switch needs to be **accessible externally**, or at least there should be an external way to **easily turn off everything**.

The _CATS Vega_ is a COTS (Commercially Of The Shelf) product that needs to **interface** with the rocket in **parallel** with our _stack_, and acts like a failsafe that EuRoC requires. The thing is, as of now servos cannot be easily wired to the _CATS Vega_, as they use PWM and so **cannot** be wired in parallel. One obvious solution would be to double the number of servos (one set for our _stack_ and the other for the _CATS Vega_), but that's an issue in and of itself for the Recovery team!

Cables have a huge **room for improvements**!

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

**The system is too complex.**

There's **no need for state** management **pre flight**, it's just useless and adds unnecessary complexity. **Software arming** (in addition to physical arming), is also **unnecessary**, the charger will be plugged in on the ramp, so electric consumption shouldn't be an issue. And what if the interferences **stops the arming** command from being received? The rocket control wouldn't start, and it would **crash** miserably.

Code is **not so well organized**, but we've rushed the last couple of weeks.

It's **hard for non technical** people to use the board, just for testing. There should be a debug applications (like the one for the servos), or even a **debug/manual mode** in the actual application which could be accessed in some way.

LEDs are almost ignored, as they're **difficult to identify**, some are burnt and some fry your eyes. We're **not using the ring lights**, but they're plenty useful and **NEED** to be implemented for an actual launch.

There's **no actual code** for the scheduling, flight control and safety timers.

### What's next

We need to add some high priority timers which run at the start of the flight, which dictate the deadlines and should account for any software or control function bug or issue.

## Other

We'll see!
