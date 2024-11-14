---
title: Baremetal IDE Lab
layout: default
nav_order: 11
---


# Baremetal IDE Lab
Baremetal IDE is an SDK developed and maintained by the SLICE lab at Berkeley which allows you to quickly develop C/C++ for chips developed in Chipyard. As implied by the name, Baremetal IDE focuses on providing a bunch of libraries, scripts and device drivers to build “baremetal” programs which run without an operating system like Linux or Zephyr. Programming for bare metal means that you don’t have a bunch of operating system services that you may be used to like multithreading, device drivers, dynamic linking, etc, but in return, you have full control of your code and can extract the maximum amount of performance out of your chips. Baremetla IDE provides a thin layer of drivers and libraries that handles things like malloc or print. This lets you focus on building your workloads to test your chips instead of spending your time messing with linker scripts, stdlib versions, and device drivers.  
Since the actual HeatherLake setups are a bit fragile and require lots of external support equipment, we’ll be running all of these labs on an emulated chip on a Datastorm FPGA. This lab will bring you through the whole process of getting started with a new chip, building a Board Support Package, writing some basic drivers, and benchmarking a simple accelerator. 

## The Trenz Datastorm Board
![The Trenz Datastorm Board](assets/datastorm_diagram.png)

Before we begin, let’s take a closer look at the Trenz Datastorm. Since this is the standard FPGA board we will be using for the rest of the class for Bringup once the PCBs come back, it’s worth getting familiar with its functions and usage. These boards are based on the Cyclone V SoC 5CSEMA5F31 which is a chip that contains both 85K Logic Elements of FPGA fabric and two ARM CPU cores which Intel calls the Hard Processor System. These boards also come with a lot of peripherals like USB, HDMI, or Ethernet, but we’re ignoring them for now. 
The full board documentation can be found here but we’ve highlighted the most important parts for using the Datastorm for this lab. Since this isn’t an FPGA lab, we’ll mostly be glossing over the inner workings of the board and just touch the parts you’ll have to work with directly.
Going clockwise from the top, we have:
1.	4 PMOD connectors which provide 8 3.3V GPIOs each
2.	An FMC-LPC connector which contains 62 additional GPIOs which can connect to a daughterboard
3.	Two LEDs hooked up to the FPGA
4.	 One general purpose switch, 
5.	FPGA reset button
6.	A USB port for programming the FPGA and accessing a UART connection to the FPGA
7.	A Barrel Jack for delivering 12V DC

## The Lab Bitstream
For this lab, the Datastorm FPGAs set up on the lab benches are preprogrammed to emulate a Chipyard Chip very similar to the ones that were taped out last semester and that you will be bringing up. It contains 1 Rocket core, 1 2-pin GPIO bank, 1GB of external DRAM, 1 UART, 1 UART-TSI port, a JTAG tap, and a custom addition accelerator which we will be explaining later. The JTAG and UART ports are going to a device called the FT-LINK which acts like a combination USB UART adapter and USB JTAG Adapter. 

[INSERT PHOTO HERE]

Here’s how things are connected on the FPGA:

| FPGA Port     | Chip Function            |
| ------------- | ------------------------ |
| USB Serial    | Port	UART TSI           |
| FPGA RST	    | Chip Reset               |
| FPGA LED 1    | Chip Status (Always lit) |
| FPGA LED 2    | GPIO 0                   |
| PMOD 1	      | JTAG + UART              |
| FPGA BTN	    | GPIO 1                   |

And here’s a memory map of the system:

| Device                | Base Address |
| --------------------- | ------------ |
| Boot Address Register | 0x1000       |
| Boot ROM              | 0x2000       |
| CLINT                 | 0x2000000    |
| PLIC                  | 0xC000000    |
| Addition Accelerator  | 0x8800000    |
| GPIO A                | 0x10010000   |
| UART 0                | 0x10020000   |

## Setup and Navigating the BWRC Environment
Before we begin writing software for Baremetal IDE we need to set up our workspace and compiler toolchain. While you can set this up locally on your machine [(see here)](https://ucb-bar.gitbook.io/chipyard/quickstart/setting-up-risc-v-toolchain) so you can build RISCV programs on your own machine, the documentation for how to do that is a bit out of date so the rest of this lab assumes you are using the BWRC environment. 
To begin, log into a BWRC machine by either SSHing into one of the login servers like `bwrcrdsl-1.eecs.berkeley.edu` or by going up to one of the four workstations that are set up on benches 11 and 12 in BWRC and logging in. Then, simply source this environment file to active the Bringup Class environment and get access to all the tools you’ll need.
``` bash
source /tools/C/ee290-fa24-2/ee290-env.sh
```
You’ll need to run this command every time you open a new terminal window so it may be worth placing this command in your bashrc so you don’t have to keep typing it in.
Now, navigate to the folder `/tools/C` and create a folder called your username. The entire drive mapped to /tools/C is backed up hourly and available to all machines connected to the BWRC network, including the lab benches and login servers. This means you can remotely build on one of the BWRC servers from your laptop and have the files immediately show up on the lab machines to deploy to your chip.
Once you’re in your /tools/C folder, clone a copy of the Sp24 Barmetal IDE and checkout the `fa24-lab` branch with the following commands:
``` bash
git clone git@github.com:ucb-bar/sp24-Baremetal-IDE.git
git checkout fa24-lab
```

## Exploring Baremetal IDE
Now that we've got a copy of Baremetal IDE, let's take a closer look at all of its files and how it works. If you haven’t already, we highly recommend opening your cloned Baremetal IDE folder in a proper editor. The ee290 environment contains VSCode preinstalled which can be accessed with the command `code` from the terminal. Baremetal IDE is based around [CMake]( https://cmake.org/), a build system that encourages modularity and makes it easy to manage lots of dependencies. CMake incredibly powerful, but that power also comes with a good deal of complexity. While this lab will attempt to explain the basics, we highly encourage you to explore CMake further as it is one of the most widely used build systems for C/C++ in both embedded and application programming. While you are here, you should take some time to get familiar with the directory structure of Baremetal IDE. Here’s a quick overview to highlight the key files:

### `platform/labchip`
Within the platform folder, we have a bunch of folders containing chip specific files and information. For today, this will be the `labchip` folder. Each folder will have at minimum the five following files, though a chip may have more to support other functionality or include chip specific drivers.

`chip_config.h`  
This file contains defines for all of the MMIO devices within a chip as well as runtime information such as the system clock frequency. You should fill this file out with defines for all the devices that are on the chip and include those devices’ driver’s headers at the top.

`chip.c`  
A dummy file for CMake to add to include chip_config.h

`CMakeLists.txt`  
This is the file that tells CMake to add the header file we just created to the project and defines what device drivers CMake should link. By default, this currently contains the rocketcore and clint drivers but you may need to add others for the rest of the lab using the `target_link_libraries` directive.

`labchip.cfg`  
This file sets the configuration for JTAG debugging

`labchip.ld`  
This is the linker script that allows us to specify where each segment of a program should go. Since we do not have a scratchpad or flash on the emulated chip, everything just goes into DRAM.

### `lab`
This folder contains a bunch of subfolders that each contain an `include` and `src` folder that you can write program in. Each folder is setup to be its own target so you can build them individually without overwriting a previous step.

## Building Blinky

#### The Blinky Program
To introduce the Baremetal IDE build flow, we are going start off with a blinky program which is kind of like the “Hello World” of embedded systems programming. All it will do is blink the LED attached to GPIO pin 0 at 5 Hz. This program has been simplified down to the bare minimum to make it easier to understand, ignoring all of the provided libraries and style conventions in favor of directly reading and writing to registers. We will go over cleaner, more idiomatic examples later on, but it’s important to know what’s going on underneath the hood. If you want to dig deeper into how the actual build process is handled and how all the steps of compilation fit together, Yufeng Chi from the SLICE lab has written an excellent guide [here]( https://notes.tk233.xyz/risc-v-soc/risc-v-baremetal-from-the-ground-up-chipyard-edition) going over how to build a program from scratch without something like Baremetal IDE.
``` c
#include <stdint.h>

uint32_t *GPIOA_OUTPUT_VAL = (uint32_t*) 0x1001000CUL;
uint32_t *GPIOA_OUTPUT_EN  = (uint32_t*) 0x10010008UL;
uint32_t *CLINT_MTIME      = (uint32_t*) 0x0200BFF8UL;

void delay(unsigned int ticks) {
  unsigned int mtime_start;
  while (*CLINT_MTIME - mtime_start < ticks);
}

void main() {
    int counter = 0;

    *GPIOA_OUTPUT_EN = 0b1;

    while (1) {
        if (counter % 2 == 0) {
            *GPIOA_OUTPUT_VAL = 0b1;
        } else {
            *GPIOA_OUTPUT_VAL = 0b0;
        }
        counter ++;
        delay(4000000);
    }
}
```
The blinky program begins with some pointer definitions that define where all of the control registers of the GPIOs exist. Of special note is the `CLINT_MTIME` register which is separate from the GPIO bank. `CLINT_MTIME` is a register that simply counts up once every clock cycle which is useful for timing operations and setting delays. Next, we have a small function that uses the `MTIME` register to implement a small delay function, followed by our main program. Here, we simply enable pin zero’s output by writing a 1 to bit 0 of the `GPIOA_OUTPUT_EN` register then jump into our blink loop, either setting pin 0 high or low depending on the counter and delaying for 4,000,000 clock cycles. Since our chip is running at 40MHz, this corresponding to toggling the GPIO pin 10 times a second resulting in a blink rate of 5Hz. 

#### Building Blinky
If you take a look at the d01 folder within lab, you should also see a `CMakeLists.txt` file in addition to `main.c`. 
``` bash
#################################
# Build
#################################

add_executable(blinky
  main.c
)

target_link_libraries(blinky PRIVATE 
  -L${CMAKE_BINARY_DIR}/glossy -Wl,--whole-archive glossy -Wl,--no-whole-archive
)
```
This is what tells CMake that our blinky program is a program that should be built. The way you read this file the `add_executable` directive creates a make target called `blinky` with one source file, `main.c` and the `target_link_libraries` specifies that we want to link our blinky program with glossy, our libc that provides the C runtime. To actually build the executable takes two commands
``` bash
cmake -S ./ -B ./build/ -D CMAKE_BUILD_TYPE=Debug -D CMAKE_TOOLCHAIN_FILE=./riscv-gcc.cmake -D CHIP=labchip
cmake --build ./build/ --target blinky
```
The first command reads all of our CMakeLists.txt files and configures the tools that actually build the project. This only needs to be run if you change a CMakeLists.txt file or you are just setting up your repository. Otherwise, the second command is sufficient. The second command actually builds the program in the build folder. If you look within your build folder, you should now have the file `build/lab/d01/main.c` which is our final binary.

## Programming the Chip
Once we have our ELF binary of program, we now need to somehow get it onto the chip so we can see if our program wroks and show off our demos. There are two primary interfaces for programming the chip, UART-TSI and JTAG which have their own pro's and cons. For these next steps, please be at one of the four workstations at the lab benches.

### UART-TSI Programming
Our emulated chip has a UART-TSI port which is an interface that allows a computer to make TileLink read/writes by reading/writing to a UART. Normally, this would be on a separate FPGA when you are talking to a real chip but for simplicity, this lab only uses one FPGA. `uart_tsi` is a program that can read in an ELF binary, read the header, and issue the correct write commands to load the binary into the chip's memory. UART-TSI has the benefit of being relatively fast and lightweight, but has the downside of requiring an FPGA to work. To begin, simply type `uart_tsi` in your console which displays the help screen.

``` bash
Starting UART-based TSI
Usage: ./uart_tsi +tty=/dev/pts/xx <PLUSARGS> <bin>
       ./uart_tsi +tty=/dev/ttyxx  <PLUSARGS> <bin>
       ./uart_tsi +tty=/dev/ttyxx  +no_hart0_msip +init_write=0x80000000:0xdeadbeef none
       ./uart_tsi +tty=/dev/ttyxx  +no_hart0_msip +init_read=0x80000000 none
       ./uart_tsi +tty=/dev/ttyxx  +selfcheck <bin>
       ./uart_tsi +tty=/dev/ttyxx  +baudrate=921600 <bin>
ERROR: Must use +tty=/dev/ttyxx to specify a tty
```

Let's break down the arguments here  
`+tty=<tty>` specifies what serial port the chip's UART-TSI port is on.
>> Unfortunately, due to the way Unix handles serial devices, the exact device ID changes every time you unplug and replug your device. The best way of figuring out which serial port is which is unplug the device you are trying to find the id of, run the command `ls /dev/ttyUSB*` to lists out all remaining USB serial ports, plug the device in again, and run the command one last time to find the new serial port. For the lab, UART-TSI is on the usb port hooked directly up to the FPGA, not the one plugged into the FT-LINK.

`+baudrate=<baudrate>` specifies which baudrate the computer should talk to the chip at. This must match whatever the chip was configured for. In our case, this is 921600 baud.

`+no_hart0_msip` specifies that we should not send a **M**achine **S**oftware **I**nterrupt to hart0 or core 0. By default, after completing all reads and writes, UART-TSI sets the hart0 msip register to 1 which sends an interrupt to core 0 of the chip which tells the chip that we are done loading in the program and should jump to the address in the boot address register to start executing. Specify this argument if you do not want the core to boot up, such as when you are just doing read/writes.

`+init_read=<Read Address>` specifies that we should do a read at a given address before loading in our binary. This always reads a 32 bit word from memory and rounds down any address to the nearest multiple of 4. The address must be given in hex and be prefixed with `0x`

`+init_write=<Write Address>:<Write Value>` specifies that we should do a write to a given address before loading in our binary. This always writes a 32 bit word to memory, rounds down any address to the nearest multiple of 4, and zero extends the write value to 32 bits. Both the address and write value must be in hex and prefixed with `0x`

`<bin>` is the binary that you want to load onto the chip. This can be `none` if no binary is desired.

> **Task 1**: Write down a sequence of uart_tsi commands that will turn on the LED attached to GPIO pin 0 and another sequence that will allow you to read the status of the button on GPIO pin 1.


Putting that all together we get this command to load the blinky binary we just built to the chip.

``` bash
uart_tsi +tty=[YOUR_TTY] +baudrate=921600 build/d01/blinky.elf
```

Before running a program with uart_tsi, make sure to hit the reset button. While the read/writes will work just fine, the chip neeeds to be fresh out of the reset state in order to start running the loaded program correctly. If everything worked properly, you should see an LED flashing on the FPGA.

### JTAG Programming
JTAG is the other main programming interface on our chip and it is much more powerful than UART-TSI is, giving you full access into the internal state of the chip such as registers and program counters in addition to memory and letting you set breakpoints and single step a program for easier debugging. In fact, you can attach GDB to your chip and debug your program as if it were a desktop application with all of the features you would expect.

Debugging a chip with JTAG requires two programs, OpenOCD and GDB. OpenOCD is a program that abstracts away all the details of talking to every single chip and every single debugging probe and exposes a simplfied higher level of abstraction to programs that build on top of it like GDB. In our case, OpenOCD will handle talking to our FT-LINK USB JTAG adapter for us. To start OpenOCD, in a separate terminal run the following command:
``` bash
openocd -f platform/labchip/labchip.cfg
```
This starts up OpenOCD using the chip specific settings we defined in our platform file and starts up some network sockets that other programs can connect to.

While you can use OpenOCD standalone to peek and poke registers and memory, the real benefit of JTAG comes when you use a higher level debugger. In a separate terminal run the follwing command:
``` bash
$ riscv64-unknown-elf-gdb build/d01/blinky.elf
GNU gdb (GDB) 14.1
Copyright (C) 2023 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
Type "show copying" and "show warranty" for details.
This GDB was configured as "--host=x86_64-pc-linux-gnu --target=riscv64-unknown-elf".
Type "show configuration" for configuration details.
For bug reporting instructions, please see:
<https://www.gnu.org/software/gdb/bugs/>.
Find the GDB manual and other documentation resources online at:
    <http://www.gnu.org/software/gdb/documentation/>.

For help, type "help".
Type "apropos word" to search for commands related to "word"...
Reading symbols from build/lab/d01/blinky.elf...
(gdb) 
```
This starts up GDB that's been built to understand RISCV opcodes, tells GDB what binary we want to be running and debugging, and drops us into a gdb shell.  
Next, we need to connect to our actual chip and reset it. In the GDB console, run the following command:
``` bash
(gdb) target extended-remote localhost:3333
(gdb) monitor reset
JTAG tap: riscv.cpu tap/device found: 0x00000001 (mfg: 0x000 (<invalid>), part: 0x0000, ver: 0x0)
```
Now we are connected to the chip and can issuing commands to debug the chip like so:
``` bash
(gdb) x/8wh 0x80000000
```
To load the program onto the chip, we can use the load command:
``` bash
(gdb) load
Loading section .text, size 0x3a08 lma 0x20000000
Loading section .rodata, size 0x680 lma 0x20003a08
Loading section .data, size 0x350 lma 0x20004088
Loading section .sdata, size 0x18 lma 0x200043d8
Start address 0x00000000200000a8, load size 17392
Transfer rate: 3 KB/sec, 4348 bytes/write.
```
From here you can either type `run` and let the program start or set a breakpoint. At this point you are in GDB and can treat it like any other debugging session.

>**Task 2** Set a breakpoint on the delay function. What value is the stack pointer when you enter the function? What address is the `mtime_start` variable at?

>**Task 3** Now that you've seen how to program the chips and how to write a basic program for bare metal, modify this program so the LED will only blink when the button is pressed. As a reminder, the button is hooked up to pin 1 of the GPIO bank. The [U540 Manual](https://www.sifive.com/document-file/freedom-u540-c000-manual) may be helpful for finding which registers need to be set and read.