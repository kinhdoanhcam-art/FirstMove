declare module './pytext.mjs' {
  export function pyStrip(value: string): string
  export function pyLen(value: string): number
  export function pyNormalizeWhitespace(value: string): string
}

declare module './preflight.mjs' {
  export function requireArrangementAbsent<T>(
    readArrangement: (id: string) => Promise<T>,
    arrangementId: string,
  ): Promise<true>
}

declare module './rpc-errors.mjs' {
  export function contractReceiptMessage(error: unknown): string
}
