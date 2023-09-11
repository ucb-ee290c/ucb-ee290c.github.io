---
title: Setting up RISC-V Environment - Ubuntu
layout: default
parent: Setting up RISC-V Environment
---

# Setting up RISC-V Environment - Ubuntu
{: .no_toc }

<details open markdown="block">
  <summary>
    Table of contents
  </summary>
  {: .text-delta }
- TOC
{:toc}
</details>

This is the recommended method.

## Install RISC-V Toolchain

First, we need to install the following dependencies:

```bash
sudo apt install texinfo bison flex libgmp-dev
```



Clone the RISC-V GNU Toolchain repo. 

```bash
cd ~/Downloads
git clone git@github.com:riscv-collab/riscv-gnu-toolchain.git
cd ~/Downloads/riscv-gnu-toolchain/
```

Run configuration. The prefix is where we want to install the toolchain. Here, we will be installing under the riscv64-unknown-toolchain directory.

```bash
./configure --prefix=/home/tk/Documents/RISCV/riscv64-unknown-toolchain/ --with-multilib-generator="rv32i-ilp32--;rv32im-ilp32--;rv32ima-ilp32--;rv32imac-ilp32--;rv32imafc-ilp32f--;rv64i-lp64--;rv64im-lp64--;rv64ima-lp64--;rv64imac-lp64--;rv64imaf-lp64f--;rv64imafd-lp64d--;rv64imafdc-lp64d--"
```

Build the toolchain

```bash
make
```

## Install OpenOCD

Clone the RISC-V OpenOCD repo

```bash
cd ~/Documents/RISCV/
git clone https://github.com/riscv/riscv-openocd.git
cd ~/Documents/RISCV/riscv-openocd
```

```bash
./bootstrap
./configure
make
sudo make install
```


