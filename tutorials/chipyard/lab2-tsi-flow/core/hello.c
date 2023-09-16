#include <stdint.h>

uint32_t *UART_TX_DATA = (uint32_t *)0x1000U;

void UART_transmit(uint8_t c) {
  *UART_TX_DATA = c;
}

int main() {
  while (1) {
    UART_transmit('H');
  }
}