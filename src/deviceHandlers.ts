export function ctCheckRange(ct: number): boolean {
  if (ct < 1700 || ct > 6500) {
    throw new RangeError('[yee-ts]: Ct value must be in range between 1700 - 6500');
  }

  return true;
}

export function rgbCheckRange(full: number | null, r: number, g: number, b: number): boolean {
  if (full) {
    if (full < 0 || full > 16777215) {
      throw new RangeError('[yee-ts]: RGB must be in range between 0 - 16777215');
    }
  }

  if (r < 0 || r > 255) {
    throw new RangeError('[yee-ts]: Red value must be in range between 0 - 255');
  } else if (g < 0 || g > 255) {
    throw new RangeError('[yee-ts]: Gren value must be in range between 0 - 255');
  } else if (b < 0 || b > 255) {
    throw new RangeError('[yee-ts]: Blue value must be in range between 0 - 255');
  }

  return true;
}

export function hueCheckRange(hue: number): boolean {
  if (hue < 0 || hue > 359) {
    throw new RangeError('[yee-ts]: Hue value must be in range between 0 - 359');
  }

  return true;
}

export function satCheckRange(sat: number): boolean {
  if (sat < 0 || sat > 100) {
    throw new RangeError('[yee-ts]: Sat value must be in range between 0 - 100');
  }

  return true;
}

export function brightCheckRange(bright: number): boolean {
  if (bright < 1 || bright > 100) {
    throw new RangeError('[yee-ts]: Bright value must be in range between 1 - 100');
  }

  return true;
}

export function rgbToFull(r: number, g: number, b: number): number {
  return (r * 65536) + (g * 256) + b;
}