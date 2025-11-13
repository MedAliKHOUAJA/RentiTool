declare global {
    interface TextEncoder {
      encode(input?: string): Uint8Array;
    }
    interface TextDecoder {
      decode(input?: Uint8Array): string;
    }
    var TextEncoder: {
      prototype: TextEncoder;
      new(): TextEncoder;
    };
    var TextDecoder: {
      prototype: TextDecoder;
      new(): TextDecoder;
    };
  }
  
  export {};