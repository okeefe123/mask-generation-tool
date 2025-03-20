import { describe, it, expect } from 'vitest';
import theme from '../../theme/theme';

describe('Theme Configuration', () => {
  it('should have the correct structure', () => {
    expect(theme).toBeDefined();
    expect(theme.colors).toBeDefined();
    expect(theme.fonts).toBeDefined();
    expect(theme.components).toBeDefined();
    expect(theme.styles).toBeDefined();
  });
  
  it('should have brand colors defined', () => {
    expect(theme.colors.brand).toBeDefined();
    expect(theme.colors.brand[500]).toBe('#0080ff'); // Primary brand color
  });
  
  it('should have gray scale colors defined', () => {
    expect(theme.colors.gray).toBeDefined();
    expect(theme.colors.gray[50]).toBe('#f8f9fa'); // Lightest gray
    expect(theme.colors.gray[900]).toBe('#212529'); // Darkest gray
  });
  
  it('should have semantic colors defined', () => {
    expect(theme.colors.success).toBeDefined();
    expect(theme.colors.warning).toBeDefined();
    expect(theme.colors.error).toBeDefined();
  });
  
  it('should have font families defined', () => {
    expect(theme.fonts.body).toContain('Inter');
    expect(theme.fonts.heading).toContain('Inter');
    expect(theme.fonts.mono).toContain('SFMono-Regular');
  });
  
  it('should have button component styles defined', () => {
    expect(theme.components.Button).toBeDefined();
    expect(theme.components.Button.baseStyle).toBeDefined();
    expect(theme.components.Button.variants).toBeDefined();
    
    // Check if solid and outline variants are defined
    expect(typeof theme.components.Button.variants.solid).toBe('function');
    expect(typeof theme.components.Button.variants.outline).toBe('function');
  });
  
  it('should have global styles defined', () => {
    expect(theme.styles.global).toBeDefined();
    expect(theme.styles.global.body).toBeDefined();
    expect(theme.styles.global.body.bg).toBe('gray.50');
    expect(theme.styles.global.body.color).toBe('gray.800');
  });
});