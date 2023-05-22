/* Yufeng Chi (chiyufeng@berkeley.edu) */

ENTRY(main)

MEMORY {
  SRAM(rwx): ORIGIN = 0x_0000000, LENGTH = _K
}

SECTIONS {
  /*
  .isr_vector : {
    . = ALIGN(4);
    KEEP(*(.isr_vector)) /* Startup code *
    . = ALIGN(4);
  }> SRAM
*/
  .text : {
    *(.text.init)
    *(.text)
  }> SRAM
  
  /* data segment */
  .data : {
    *(.data)
  }> SRAM

  .sdata : {
    __global_pointer$ = . + 0x800;
    *(.srodata.cst16) *(.srodata.cst8) *(.srodata.cst4) *(.srodata.cst2) *(.srodata*)
    *(.rodata)
    *(.sdata .sdata.* .gnu.linkonce.s.*)
    . = ALIGN(4);
  }> SRAM
  
  /* bss segment */
  .sbss : {
    *(.sbss .sbss.* .gnu.linkonce.sb.*)
    *(.scommon)
  }> SRAM

  .bss : {
    *(.bss)
  }> SRAM

  /* thread-local data segment */
  .tdata : {
    _tdata_begin = .;
    *(.tdata)
    _tdata_end = .;
  }> SRAM
  
  .tbss : {
    *(.tbss)
    _tbss_end = .;
  }> SRAM

  /* End of uninitalized data segement */
  _end = .;
}
