import { describe, it, expect } from 'vitest';
import {
  customOrderFabricSchema,
  customOrderFabricUpdateSchema,
  customOrderColorSchema,
  customOrderColorUpdateSchema,
} from '@/lib/validations';

describe('customOrderFabricSchema (create)', () => {
  const valid = {
    name: 'Cotton',
    imageUrl: '/uploads/cotton.jpg',
  };

  it('accepts a valid fabric payload', () => {
    const result = customOrderFabricSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe('Cotton');
      expect(result.data.imageUrl).toBe('/uploads/cotton.jpg');
      expect(result.data.displayOrder).toBe(0);
      expect(result.data.isActive).toBe(true);
    }
  });

  it('applies defaults for displayOrder and isActive', () => {
    const result = customOrderFabricSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayOrder).toBe(0);
      expect(result.data.isActive).toBe(true);
    }
  });

  it('rejects a missing name', () => {
    const result = customOrderFabricSchema.safeParse({ ...valid, name: undefined });
    expect(result.success).toBe(false);
  });

  it('rejects a whitespace-only name', () => {
    const result = customOrderFabricSchema.safeParse({ ...valid, name: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects a name longer than 100 characters', () => {
    const result = customOrderFabricSchema.safeParse({ ...valid, name: 'x'.repeat(101) });
    expect(result.success).toBe(false);
  });

  it('rejects a missing image (image is required)', () => {
    const result = customOrderFabricSchema.safeParse({ name: 'Cotton' });
    expect(result.success).toBe(false);
  });

  it('rejects an empty image URL', () => {
    const result = customOrderFabricSchema.safeParse({ ...valid, imageUrl: '' });
    expect(result.success).toBe(false);
  });

  it('rejects a whitespace-only image URL', () => {
    const result = customOrderFabricSchema.safeParse({ ...valid, imageUrl: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects a negative display order', () => {
    const result = customOrderFabricSchema.safeParse({ ...valid, displayOrder: -1 });
    expect(result.success).toBe(false);
  });

  it('rejects a non-integer display order', () => {
    const result = customOrderFabricSchema.safeParse({ ...valid, displayOrder: 1.5 });
    expect(result.success).toBe(false);
  });

  it('rejects display order above 9999', () => {
    const result = customOrderFabricSchema.safeParse({ ...valid, displayOrder: 10000 });
    expect(result.success).toBe(false);
  });

  it('rejects a non-boolean isActive', () => {
    const result = customOrderFabricSchema.safeParse({ ...valid, isActive: 'yes' });
    expect(result.success).toBe(false);
  });

  it('coerces numeric strings for displayOrder (form input)', () => {
    const result = customOrderFabricSchema.safeParse({ ...valid, displayOrder: '5' });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.displayOrder).toBe(5);
  });
});

describe('customOrderFabricUpdateSchema (patch)', () => {
  it('accepts a partial payload with only isActive', () => {
    const result = customOrderFabricUpdateSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(false);
      expect(result.data.name).toBeUndefined();
      expect(result.data.imageUrl).toBeUndefined();
      expect(result.data.displayOrder).toBeUndefined();
    }
  });

  it('accepts imageUrl null to clear an image', () => {
    const result = customOrderFabricUpdateSchema.safeParse({ imageUrl: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.imageUrl).toBeNull();
  });

  it('still rejects an empty imageUrl string', () => {
    const result = customOrderFabricUpdateSchema.safeParse({ imageUrl: '' });
    expect(result.success).toBe(false);
  });

  it('still rejects an empty name', () => {
    const result = customOrderFabricUpdateSchema.safeParse({ name: '  ' });
    expect(result.success).toBe(false);
  });
});

describe('customOrderColorSchema (create)', () => {
  const valid = {
    fabricId: 'cof_seed_cotton',
    name: 'Sky Blue',
    imageUrl: '/uploads/sky-blue.jpg',
  };

  it('accepts a valid color payload', () => {
    const result = customOrderColorSchema.safeParse(valid);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.fabricId).toBe('cof_seed_cotton');
      expect(result.data.name).toBe('Sky Blue');
      expect(result.data.displayOrder).toBe(0);
      expect(result.data.isActive).toBe(true);
    }
  });

  it('rejects a missing fabricId', () => {
    const result = customOrderColorSchema.safeParse({ ...valid, fabricId: undefined });
    expect(result.success).toBe(false);
  });

  it('rejects an empty fabricId', () => {
    const result = customOrderColorSchema.safeParse({ ...valid, fabricId: '   ' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing name', () => {
    const result = customOrderColorSchema.safeParse({ ...valid, name: undefined });
    expect(result.success).toBe(false);
  });

  it('rejects a whitespace-only name', () => {
    const result = customOrderColorSchema.safeParse({ ...valid, name: '  ' });
    expect(result.success).toBe(false);
  });

  it('rejects a missing image (image is required)', () => {
    const result = customOrderColorSchema.safeParse({
      fabricId: valid.fabricId,
      name: valid.name,
    });
    expect(result.success).toBe(false);
  });

  it('rejects a negative display order', () => {
    const result = customOrderColorSchema.safeParse({ ...valid, displayOrder: -3 });
    expect(result.success).toBe(false);
  });
});

describe('customOrderColorUpdateSchema (patch)', () => {
  it('accepts a partial payload with only isActive', () => {
    const result = customOrderColorUpdateSchema.safeParse({ isActive: false });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.isActive).toBe(false);
      expect(result.data.name).toBeUndefined();
      expect(result.data.displayOrder).toBeUndefined();
      expect(result.data.imageUrl).toBeUndefined();
    }
  });

  it('accepts imageUrl null to clear an image', () => {
    const result = customOrderColorUpdateSchema.safeParse({ imageUrl: null });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.imageUrl).toBeNull();
  });

  it('rejects an empty imageUrl string', () => {
    const result = customOrderColorUpdateSchema.safeParse({ imageUrl: '' });
    expect(result.success).toBe(false);
  });
});
