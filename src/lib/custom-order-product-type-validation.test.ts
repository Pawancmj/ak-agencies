import { describe, it, expect } from 'vitest';
import { customOrderProductTypeSchema } from '@/lib/validations';
import { slugify } from '@/lib/utils';

const validProductType = {
  name: 'Roman Blinds',
  slug: 'roman-blinds',
  description: 'Custom Roman blinds made to order',
  displayOrder: 8,
  isActive: true,
};

describe('customOrderProductTypeSchema', () => {
  it('accepts a valid product type', () => {
    const result = customOrderProductTypeSchema.safeParse(validProductType);
    expect(result.success).toBe(true);
  });

  it('applies default displayOrder and isActive when omitted', () => {
    const result = customOrderProductTypeSchema.safeParse({
      name: 'Roman Blinds',
      slug: 'roman-blinds',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.displayOrder).toBe(0);
      expect(result.data.isActive).toBe(true);
    }
  });

  it('accepts product type without description', () => {
    const { description: _, ...rest } = validProductType;
    const result = customOrderProductTypeSchema.safeParse(rest);
    expect(result.success).toBe(true);
  });

  it('accepts null description', () => {
    const result = customOrderProductTypeSchema.safeParse({
      ...validProductType,
      description: null,
    });
    expect(result.success).toBe(true);
  });

  it('accepts slug generated from name via slugify', () => {
    const result = customOrderProductTypeSchema.safeParse({
      name: 'Roman Blinds',
      slug: slugify('Roman Blinds'),
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.slug).toBe('roman-blinds');
  });

  it('rejects missing name', () => {
    const { name: _, ...rest } = validProductType;
    const result = customOrderProductTypeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects empty name', () => {
    const result = customOrderProductTypeSchema.safeParse({
      ...validProductType,
      name: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only name', () => {
    const result = customOrderProductTypeSchema.safeParse({
      ...validProductType,
      name: '   ',
    });
    expect(result.success).toBe(false);
  });

  it('rejects name exceeding 100 characters', () => {
    const result = customOrderProductTypeSchema.safeParse({
      ...validProductType,
      name: 'a'.repeat(101),
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing slug', () => {
    const { slug: _, ...rest } = validProductType;
    const result = customOrderProductTypeSchema.safeParse(rest);
    expect(result.success).toBe(false);
  });

  it('rejects empty slug', () => {
    const result = customOrderProductTypeSchema.safeParse({
      ...validProductType,
      slug: '',
    });
    expect(result.success).toBe(false);
  });

  it('rejects uppercase slug', () => {
    const result = customOrderProductTypeSchema.safeParse({
      ...validProductType,
      slug: 'Roman-Blinds',
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with spaces', () => {
    const result = customOrderProductTypeSchema.safeParse({
      ...validProductType,
      slug: 'roman blinds',
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with special characters', () => {
    const result = customOrderProductTypeSchema.safeParse({
      ...validProductType,
      slug: 'roman_blinds!',
    });
    expect(result.success).toBe(false);
  });

  it('rejects slug with leading or trailing hyphen', () => {
    const leading = customOrderProductTypeSchema.safeParse({
      ...validProductType,
      slug: '-roman-blinds',
    });
    const trailing = customOrderProductTypeSchema.safeParse({
      ...validProductType,
      slug: 'roman-blinds-',
    });
    expect(leading.success).toBe(false);
    expect(trailing.success).toBe(false);
  });

  it('rejects negative displayOrder', () => {
    const result = customOrderProductTypeSchema.safeParse({
      ...validProductType,
      displayOrder: -1,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-integer displayOrder', () => {
    const result = customOrderProductTypeSchema.safeParse({
      ...validProductType,
      displayOrder: 1.5,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-numeric displayOrder', () => {
    const result = customOrderProductTypeSchema.safeParse({
      ...validProductType,
      displayOrder: 'abc',
    });
    expect(result.success).toBe(false);
  });

  it('rejects displayOrder exceeding 9999', () => {
    const result = customOrderProductTypeSchema.safeParse({
      ...validProductType,
      displayOrder: 10000,
    });
    expect(result.success).toBe(false);
  });

  it('rejects non-boolean isActive', () => {
    const result = customOrderProductTypeSchema.safeParse({
      ...validProductType,
      isActive: 'yes',
    });
    expect(result.success).toBe(false);
  });

  it('accepts partial payloads (PATCH) such as isActive toggle', () => {
    const result = customOrderProductTypeSchema.partial().safeParse({
      isActive: false,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.isActive).toBe(false);
  });

  it('accepts partial payload with only displayOrder', () => {
    const result = customOrderProductTypeSchema.partial().safeParse({
      displayOrder: 8,
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.displayOrder).toBe(8);
  });

  it('rejects partial payload with invalid slug', () => {
    const result = customOrderProductTypeSchema.partial().safeParse({
      slug: 'Invalid Slug',
    });
    expect(result.success).toBe(false);
  });

  it('rejects partial payload with negative displayOrder', () => {
    const result = customOrderProductTypeSchema.partial().safeParse({
      displayOrder: -5,
    });
    expect(result.success).toBe(false);
  });
});
