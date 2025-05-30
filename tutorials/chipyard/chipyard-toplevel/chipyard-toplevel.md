---
title: Chipyard TopLevel
layout: default
nav_order: 6
---

# Chipyard Internals
While you can get away with simple pattern matching to integrate your accelerators and blocks into the final chip for tapeout, having a strong understanding of how chipyard puts everything together and knows what to expect is vital if you want to have the best chance possible of your chip working, especially if you need to talk to the outside world. So let's take a closer look at how Chipyard constructs and simulates a chip.

When you run a `make` command, whether it's for simulation, the VLSI flow, FPGAs, etc, Chipyard will generate four files, `TestDriver`, `TestHarness`, `ChipTop`, and `DigitalTop` along with the rest of your chip. These instantiate each other heirarchicaly as showin below, with `TestDriver` being at the top for simulations. 

```
_________________________________________________
| TestDriver                                    | 
| _____________________________________________ |
| | TestHarness                               | |
| | _________________________________________ | |
| | | ChipTop                               | | |
| | | _____________________________________ | | |
| | | | DigitalTop                        | | | |
| | | | (Rest of your chip)               | | | |
| | | |                                   | | | |
| | | |                                   | | | |
| | | |                                   | | | |
| | | |___________________________________| | | |
| | |_______________________________________| | |
| |___________________________________________| |
|_______________________________________________|
```

## DigitalTop
`DigitalTop` is the innermost "top" file which contains all of your instantiated blocks and their digital signals. It's called `DigitalTop` because this is where all of your digital IP will live. [Explain the CanHave traits here] 

## ChipTop
`ChipTop` is the top level of the Chip you will eventually tape out and instantiates any Analog IP such as PLLs and IO Cells and connects them to the corresponding pins in `DigitalTop` so that they can talk to the outside world. By default, the connections between `DigitalTop` and `ChipTop` is mediated by the IOBinders which can be found at `generators/chipyard/src/main/scala/iobinders/IOBinders.scala`. Since generating IOCells is arguably the most important function of ChipTop, let's take a closer look on how this is done using the UART IO Binders as an example.

``` scala 
class WithUARTIOCells extends OverrideIOBinder({
  (system: HasPeripheryUART) => {
    val (ports: Seq[UARTPort], cells2d) = system.uart.zipWithIndex.map({ case (u, i) =>
      val p = system.asInstanceOf[BaseSubsystem].p
      val (port, ios) = IOCell.generateIOFromSignal(u, s"uart_${i}", p(IOCellKey), abstractResetAsAsync = true)
      val where = PBUS // TODO fix
      val bus = system.asInstanceOf[HasTileLinkLocations].locateTLBusWrapper(where)
      val freqMHz = bus.dtsFrequency.get / 1000000
      (UARTPort(() => port, i, freqMHz.toInt), ios)
    }).unzip
    (ports, cells2d.flatten)
  }
})
```
The way you read scala code is that if the design we are implementing has the `HasPeripheryUART` key included in digital top, generate an IO cell for every UART in the system using the `IOCell.generateIOFromSignal` function and generate a `UARTPort` that connects to those IOCells. This allows the IOBinders to transparently handle the case where an specific block has not been instantiated in the current design. Finally, it returns a list of those ports and IO cells. The UARTPort is important because that is what the `TestHarness` looks for to hook up verification IPs. One key thing to rember is that Chipyard is designed to allow rapid experimentation and you may want to generate and attach pins differently depending on your situation, so you must include the IO binder key within your configuration. In the case of UART, this is done within `AbstractConfig`.

## TestHarness
`TestHarness` contains simulation/verification IP that hooks up to your simulated `ChipTop` when running simulations so that you can connect to the chip, load programs onto it, and test out any peripherals. This can include complicated IP like simulated memory or bringing UART prints statements to the console or simpler blocks like tying the inputs and outputs of a block together to do loopback testing. This is controlled using `HarnessBinders` which can be found at `generators/chipyard/src/main/scala/harness/HarnessBinders.scala`.
``` scala
class WithUARTAdapter extends HarnessBinder({
  case (th: HasHarnessInstantiators, port: UARTPort, chipId: Int) => {
    val div = (th.getHarnessBinderClockFreqMHz.toDouble * 1000000 / port.io.c.initBaudRate.toDouble).toInt
    UARTAdapter.connect(Seq(port.io), div, false)
  }
})
```
Going back to the UART example, we see that for every UARTPort that is created by the IO binders, we simply connect the `UARTPort`'s IO to the adapter block which allows us to see print statements.

## TestDriver
`TestDriver` is the top level simulation file that instantiates clocks and checks result codes to end the simulation when finished. There isn't too much that needs to be configured here, but it's the top level file compiled by your simulator such as VCS or Verilator so it's handy to know

# Custom ChipTops
One of the biggest changes the Digital Chips are using compared to the "standard" chipyard flow is the use of a custom ChipTop. Recall the Chipyard Hierarchy from before:
```
_________________________________________________
| TestDriver                                    | 
| _____________________________________________ |
| | TestHarness                               | |
| | _________________________________________ | |
| | | ChipTop                               | | |
| | | _____________________________________ | | |
| | | | DigitalTop                        | | | |
| | | | (Your Chip Here)                  | | | |
| | | |                                   | | | |
| | | |                                   | | | |
| | | |                                   | | | |
| | | |___________________________________| | | |
| | |_______________________________________| | |
| |___________________________________________| |
|_______________________________________________|
```

To review, `ChipTop` is the layer that holds all of the custom analog/non RTL blocks for a chip like PLLs, IO Cells, and Analog IP, as well as the clock distribution hardware. You can basically think of `Chiptop` as corresponding to the top level of the actual chip you are trying to tape out with the Inputs/Outputs corresponding to the actual pins you will create on the real chip. These blocks connect to the outside world and to the generated Digital RTL within `DigitalTop`. Normally, this file is autogenerated using the IOBinders API described in the Chipyard Hierarchy document which automatically instantiates clock selectors, generic IO cells, etc for each block which allow you to run RTL simulations and these generic components can be replaced with actual IP blocks for tapeout. This is what SCuMV is doing with their chip. However, for the Digital Chips, we are using something called AreaIO cells which aggregate four individual IO cells into a single block which the IOBinders API can't handle, hence we instead write our own.

When writing a custom `ChipTop`, your main responsibilites are setting up the clocking infrastructure, instantating any Analog IPs, and creating IOCells to interface betwen the digital portion of the Chip and the outside world. Let's take a look at how that works.

## Clocking Infrastructure

``` scala
  val system = LazyModule(p(BuildSystem)(p)).suggestName("system").asInstanceOf[DigitalTop]
  //========================
  // Diplomatic clock stuff
  //========================

  // Clocking system instantiated within PRCI domain
  val tlbus         = system.locateTLBusWrapper(system.prciParams.slaveWhere) 
  val baseAddress   = system.prciParams.baseAddress     
  val clockDivider  = system.prci_ctrl_domain { LazyModule(new TLClockDivider (baseAddress + 0x20000, tlbus.beatBytes)) }
  val clockSelector = system.prci_ctrl_domain { LazyModule(new TLClockSelector(baseAddress + 0x30000, tlbus.beatBytes)) }
  val pll           = system.prci_ctrl_domain { LazyModule(new IntelRingPll   (baseAddress + 0x40000, tlbus.beatBytes, false)) }

  // Component nodes connected thru buffer + fragmenter
  tlbus.coupleTo("clock-div-ctrl") { clockDivider.tlNode := TLFragmenter(tlbus.beatBytes, tlbus.blockBytes) := TLBuffer() := _ }
  tlbus.coupleTo("clock-sel-ctrl") { clockSelector.tlNode := TLFragmenter(tlbus.beatBytes, tlbus.blockBytes) := TLBuffer() := _ }
  tlbus.coupleTo("pll")            { pll.tlNode := TLFragmenter(tlbus.beatBytes, tlbus.blockBytes) := TLBuffer() := _ }
  
  // Establish clocking system
  system.chiptopClockGroupsNode := clockDivider.clockNode := clockSelector.clockNode
```

If we take a look at `TapeoutLab4Configs.scala` file, we can see at  the first thing we do is instantiate our DigitalTop and call it `system`. This creates all of the digital side RTL that we need to connect all of our IP to. Immediately after, we set up our clocking infrastructure. The way DigitalTop works is that it exposes a signal, `chiptopClockGroupsNode` which needs to be connected to some clock signal. In our case, we want to have two possible clock sources, a slow clock pin that goes straight to the chip for testing purpouses and the output of a PLL for high frequiencies. First, we instantiate some clocking IP including a clock divider to divide down our clock, a clock selector which allows us to switch between the PLL and clock input pin, and the PLL itself. The `tlbus` stuff there is so we can place the control registers for these blocks in the right place in the memory heirarchy and address space. The next part actually hooks up `DigitalTop`'s clock input to the output of the clock selector and divider using chisel/diplomacy's `:=` attachment operator.

``` scala
  // Create some clock sources
  val slowClockSource = ClockSourceNode(Seq(ClockSourceParameters()))
  val pllClockSource = ClockSourceNode(Seq(ClockSourceParameters()))

  // 4 clock sources
  clockSelector.clockNode := slowClockSource   
  clockSelector.clockNode := pll.pllClkNodes(0) 
  clockSelector.clockNode := pll.pllClkNodes(1) 
  clockSelector.clockNode := pll.pllClkNodes(2) 

  // Hook up PLL
  val pllLockNode = BundleBridgeSink[Bool]()  // Punch thru to top-level 
  pllLockNode := pll.lockNode
  pll.clkRefNode := pllClockSource

  // Set debug
  val debugClockSinkNode = ClockSinkNode(Seq(ClockSinkParameters()))
  debugClockSinkNode := system.locateTLBusWrapper(p(ExportDebug).slaveWhere).fixedClockNode
  def debugClockBundle = debugClockSinkNode.in.head._1

```

Once the `DigitalTop` clock input has been taken care of, we need to set up the clock divider and PLL. First, we create two `ClockSourceNode` objects which represent the node that we will hook up to the clock pin and that the `TestHarness` can connect to for simulation. Next, we hook up the `slowClockSource` as well as the three outputs the Intel PLL has to the clock selector, making sure `slowClockSource` comes first. This is important because the first connected node will be the default and it is important that the default case is the one with the least complexity for debugability. Then we hook up the PLL input to it's corresponding `ClockSourceNode`. Finally, we create a `ClockSinkNode` which we use to connect to the debug clock output which lets us verify the generated clock inside the chip. At this point, we could instantiate any other Analog IPs here using a similar process.

## Generating and Connecting IO Cells
``` scala  
  var ports: Seq[Port[_]] = Nil

  override lazy val module = new LazyRawModuleImp(this) with DontTouch {
    // 2x2 slice configuration
    val corner_io = Seq.fill(1)(Module(new hl_corner_io_wrapper()))
    val west_io = Seq.fill(9)(Module(new hl_west_io_wrapper()))
    val south_io = Seq.fill(9)(Module(new hl_south_io_wrapper()))
    val io_slices = corner_io ++ west_io ++ south_io

    ...

    def getSlice(side: String, idx: Int)

    def connectGeneric()
    ...
  }
```

After instantiating our clocks and Analog IP, we get to the most important part of a ChipTop, generating/connecting IO cells. We start by creating an empty `Seq` of `Port`s which are used by the `TestHarness` to connect verification IP to the ChipTop in simulation. Then, we instantiate the IntelIO cells and some helper functions like `connectGeneric`, `connectIn`, and `connectOut` which are used to hook up bidirectional, input, and output signals respectively. After that we hook up the various pins of each peripheral that needs to talk to the outside world to these IO cells and generate a port for simulation. Since this is the same for each block let's use the UART as an example.

``` scala
    //==========================
    // UART
    //==========================
    require(system.uarts.size == 2)
    val uart_txd_pad_0 = connectOut(system.uart(0).txd, 2, 15, "W", 3, 0)
    val uart_rxd_pad_0 = connectIn (system.uart(0).rxd, 5, 12, "W", 2, 3)
    val where = PBUS
    val bus = system.asInstanceOf[HasTileLinkLocations].locateTLBusWrapper(where)
    val freqMHz = bus.dtsFrequency.get / 1000000
    ports = ports :+ UARTPort(() => {
      val uart0 = Wire(new UARTPortIO(system.uart(0).c))
      uart0.txd := uart_txd_pad_0
      uart_rxd_pad_0 := uart0.rxd
      uart0
    }, 0, freqMHz.toInt)
```

Before you instaniate a block using a configuration key in Chipyard, you first have to register that block by inserting a `CanHave...` key within `DigitalTop` which will create a variable within `DigitalTop` that optionally contains your block or a list if you can instantiate multiple. Since we are manually hooking up these blocks to the outside world, we need to directly address these variables. The first line is an assertion that requires that the system has two UARTs. This is necessary because the ChipTop and Configuration of the chip can be independent which can lead to devices not being hooked up properly or Chipyard crashing if they go out of sync. Next, we connect the tx and rx pins of the first UART to their corresponding pads using the `connectIn` and `counnectOut` helper functions we defined previously. The values returned by these function is the pad which you can think of as the actual external bump on pacakge.

Finally, we create a new `UARTPort`, connect its RX and TX pins to those pads we just created, and append it to the ports `Seq` we defined at the top. Technically, creating ports is optional if you don't care about simulating your chip at the top level, but Custom ChipTops are prone to mistakes and being able to simulate them is important to verify that you have hooked everything up properly.
