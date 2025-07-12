import { describe, it, expect } from '@jest/globals';

describe('Color Utilities', () => {
  // Color conversion utilities
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  };
  
  const rgbToHex = (r, g, b) => {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  };
  
  describe('Color conversions', () => {
    it('should convert hex to RGB', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
      expect(hexToRgb('#0000ff')).toEqual({ r: 0, g: 0, b: 255 });
      expect(hexToRgb('#ffffff')).toEqual({ r: 255, g: 255, b: 255 });
      expect(hexToRgb('#000000')).toEqual({ r: 0, g: 0, b: 0 });
    });
    
    it('should convert RGB to hex', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
      expect(rgbToHex(0, 0, 255)).toBe('#0000ff');
      expect(rgbToHex(255, 255, 255)).toBe('#ffffff');
      expect(rgbToHex(0, 0, 0)).toBe('#000000');
    });
    
    it('should handle invalid hex values', () => {
      expect(hexToRgb('invalid')).toBeNull();
      expect(hexToRgb('#gg0000')).toBeNull();
      expect(hexToRgb('')).toBeNull();
    });
  });
  
  describe('Color manipulation', () => {
    const darken = (hex, percent) => {
      const rgb = hexToRgb(hex);
      if (!rgb) return hex;
      
      const factor = 1 - percent / 100;
      const r = Math.round(rgb.r * factor);
      const g = Math.round(rgb.g * factor);
      const b = Math.round(rgb.b * factor);
      
      return rgbToHex(r, g, b);
    };
    
    const lighten = (hex, percent) => {
      const rgb = hexToRgb(hex);
      if (!rgb) return hex;
      
      const factor = percent / 100;
      const r = Math.round(rgb.r + (255 - rgb.r) * factor);
      const g = Math.round(rgb.g + (255 - rgb.g) * factor);
      const b = Math.round(rgb.b + (255 - rgb.b) * factor);
      
      return rgbToHex(r, g, b);
    };
    
    it('should darken colors', () => {
      expect(darken('#ff0000', 50)).toBe('#800000');
      expect(darken('#ffffff', 50)).toBe('#808080');
      expect(darken('#0080ff', 25)).toBe('#0060bf');
    });
    
    it('should lighten colors', () => {
      expect(lighten('#000000', 50)).toBe('#808080');
      expect(lighten('#ff0000', 50)).toBe('#ff8080');
      expect(lighten('#0080ff', 25)).toBe('#40a0ff');
    });
  });
});