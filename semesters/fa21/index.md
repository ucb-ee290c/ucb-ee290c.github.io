---
title: Fa21 Bringup
layout: frontpage
container_type: text
nav_exclude: true
---

## Bringup of OsciBear Chip

In the Spring 2021 Tapeout class, approximately 20 students worked  to design a mixed signal radio mote chip, OsciBear, in the TSMC 28nm process.  The spec is found here:

[Osci Bear SoC Spec](https://docs.google.com/document/d/10uwl_-CENBxfJ_ImlIpCOv1I7NRhQ8Hcbgg7V-u7BpE/edit?usp=sharing)

The bringup effort was not an official class yet, (the first official Bringup class wasn't until Fall 2022) but a number of students worked on  bringup anyway.  It involved:

#### Analog

- verifying the chip drew the expected amount of current (Iddq) and there were no shorts 
- verifying the LDOs were operable

#### Digital
- TSI
  - TSI clock was outputted from the chip
  - TSI ready/valid signals and all input/output polarities were correct
  - currently just need to configure TSI module on VCU118 to completely match the one on OsciBear
- JTAG
  - testing with a JTAG connector failed, we were unable to figure out why
  - the JTAG state machine returned correct values, so we narrowed the problem down to the debug transfer module (DTM), which sits between the CPU core and the JTAG state machine
- SPI
  - dead due to issues described below
#### Issues
  - problems with custom verilog wrapper:
    - some of the signals were named incorrectly, this led to these signals being tied low
      - SPI: inoperable
      - JTAG: only the output enable signal was tied low, which in theory should yield correct behavior because the IO cells are active low (i.e. the jtag out IO cell is always enabled, so jtag data out is always seen on this pin)
  - FMC connector
    - the first revision of the PCB did not had through-hole (is that what they're called?) vias instead of filled vias, so the FMC connector couldn't be connected
      - as a result, we couldn't verify the FMC connections until rev 2
    - the second revision has an FMC connector, BUT we accidentally connected the chip to pins on the FMC connector that are unconnected on the FPGA
      - our incorrect assumption here was that the VCU118 supported all of the FMC pins (see pg 97-98 of the VCU118 Evaluation Board User Guide (UG1224) for the pins that are actually supported)
      - through bad luck we just happened to map to the wrong pins (following a template for another PCB that used the FMCP connector on the VCU118 board)
      - the VCU118 actually has FMC and FMCP connectors (FMCP just has more pins), and the FMC connector can connect to the FMCP connector...
        - BUT we can't plug the test PCB FMC to the VCU118 FMCP because there are other PCB components on the VCU118 that stick out too much and prevent them from being connected (the VCU118 is a $10k board so we definitely can't de-solder those components...)

Below is a compilation of useful links throughout the testing process.

## Useful Links

Digital bringup tutorial + log: [Digital Bringup Flow](https://docs.google.com/document/d/1tNKUDFWHfy4b8DfXr9KtJun77Pim8H7qfVuZCEdhlm4/edit?usp=sharing)

Bringup google drive folder: [Bringup](https://drive.google.com/drive/folders/1mHImadMlgaEqb85clPUeMMEmCS_kxW4K)

Directions for powering on PCB and jumper positions: [Bringup of First Board TODO](https://docs.google.com/document/d/1tQ3RLD4XybyNW1Y-uKpsSqgMtGZKb2ivfOpA7K6OlVw/edit)

PCB Git repo: https://github.com/ucberkeley-ee290c/OSCI-bear-pcb

PCB Diagram: Oski_Bear_PCB.pdf
Chipyard fork for bringup repo: https://github.com/ucberkeley-ee290c/chipyard-osci-bringup.git

Chipyard fork for spring 2021 chip: https://github.com/ucberkeley-ee290c/sp21-chipyard-osci

Bringup files repo: https://github.com/ucberkeley-ee290c/osci-bringup

feel free to refactor this repo as you see fit, I kinda just threw it together last minute

FMC pin map: [FMC Map](https://docs.google.com/spreadsheets/d/16-nCCk_3moKHb_6ItA0S6j3e3JswvQEv1zem66fprEg/edit?usp=sharing)
