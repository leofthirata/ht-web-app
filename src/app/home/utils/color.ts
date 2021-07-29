export const reset = '\x1b[0m';
export const bright = '\x1b[1m';
export const dim = '\x1b[2m';
export const underscore = '\x1b[4m';
export const blink = '\x1b[5m';
export const reverse = '\x1b[7m';
export const hidden = '\x1b[8m';

export const black = '\x1b[30m';
export const red = '\x1b[31m';
export const green = '\x1b[32m';
export const yellow = '\x1b[33m';
export const blue = '\x1b[34m';
export const magenta = '\x1b[35m';
export const cyan = '\x1b[36m';
export const white = '\x1b[37m';

export const rgb = (r: number, g: number, b: number) =>
  `\x1B[38;2;${r};${g};${b}m`;
