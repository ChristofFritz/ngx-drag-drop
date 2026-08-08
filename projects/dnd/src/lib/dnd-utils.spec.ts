import { describe, it, expect, vi } from 'vitest';
import {
  filterEffects,
  getWellKnownMimeType,
  setDragData,
  getDropData,
  getDirectChildElement,
  shouldPositionPlaceholderBeforeElement,
  calculateDragImageOffset,
  setDragImage,
  CUSTOM_MIME_TYPE,
} from './dnd-utils';

function createMockDragEvent(overrides: Partial<DragEvent> = {}): DragEvent {
  const dataStore = new Map<string, string>();
  return {
    dataTransfer: {
      types: [] as string[],
      effectAllowed: 'all',
      setData: vi.fn((type: string, data: string) => {
        dataStore.set(type, data);
        (overrides.dataTransfer as any)?.types?.push?.(type);
      }),
      getData: vi.fn((type: string) => dataStore.get(type) ?? ''),
      setDragImage: vi.fn(),
    },
    ...overrides,
  } as unknown as DragEvent;
}

describe('filterEffects', () => {
  const allEffects = ['move', 'copy', 'link'] as any;

  it('should return all effects for "all"', () => {
    expect(filterEffects(allEffects, 'all')).toEqual(['move', 'copy', 'link']);
  });

  it('should return all effects for "uninitialized"', () => {
    expect(filterEffects(allEffects, 'uninitialized')).toEqual([
      'move',
      'copy',
      'link',
    ]);
  });

  it('should filter to "copyMove"', () => {
    expect(filterEffects(allEffects, 'copyMove')).toEqual(['move', 'copy']);
  });

  it('should filter to "copyLink"', () => {
    expect(filterEffects(allEffects, 'copyLink')).toEqual(['copy', 'link']);
  });

  it('should filter to "linkMove"', () => {
    expect(filterEffects(allEffects, 'linkMove')).toEqual(['move', 'link']);
  });

  it('should return single effect for exact match', () => {
    expect(filterEffects(allEffects, 'copy')).toEqual(['copy']);
  });

  it('should return empty for "none"', () => {
    expect(filterEffects(allEffects, 'none')).toEqual([]);
  });
});

describe('getWellKnownMimeType', () => {
  it('should return null when no dataTransfer', () => {
    const event = { dataTransfer: null } as DragEvent;
    expect(getWellKnownMimeType(event)).toBeNull();
  });

  it('should return custom MIME type when present', () => {
    const customType = CUSTOM_MIME_TYPE + '-mytype';
    const event = {
      dataTransfer: { types: [customType] },
    } as unknown as DragEvent;
    expect(getWellKnownMimeType(event)).toBe(customType);
  });

  it('should return null for unknown MIME types', () => {
    const event = {
      dataTransfer: { types: ['text/plain'] },
    } as unknown as DragEvent;
    expect(getWellKnownMimeType(event)).toBeNull();
  });

  it('should return null for non-custom known MIME types', () => {
    const event = {
      dataTransfer: { types: ['application/json'] },
    } as unknown as DragEvent;
    expect(getWellKnownMimeType(event)).toBeNull();
  });

  it('should reject MIME types that only share the custom prefix', () => {
    const event = {
      dataTransfer: { types: [CUSTOM_MIME_TYPE + 'malicious'] },
    } as unknown as DragEvent;

    expect(getWellKnownMimeType(event)).toBeNull();
  });
});

describe('setDragData', () => {
  it('should set data with custom MIME type', () => {
    const event = createMockDragEvent();
    const data = { data: 'test', type: 'mytype' };
    setDragData(event, data, 'all');
    expect(event.dataTransfer!.setData).toHaveBeenCalledWith(
      CUSTOM_MIME_TYPE + '-mytype',
      JSON.stringify(data)
    );
  });

  it('should set data without type suffix when no type', () => {
    const event = createMockDragEvent();
    const data = { data: 'test' };
    setDragData(event, data, 'all');
    expect(event.dataTransfer!.setData).toHaveBeenCalledWith(
      CUSTOM_MIME_TYPE,
      JSON.stringify(data)
    );
  });
});

describe('getDropData', () => {
  it('should parse data from custom MIME type for internal drag', () => {
    const payload = { data: 'hello', type: 'mytype' };
    const mimeType = CUSTOM_MIME_TYPE + '-mytype';
    const event = {
      dataTransfer: {
        types: [mimeType],
        getData: vi.fn(() => JSON.stringify(payload)),
      },
    } as unknown as DragEvent;

    expect(getDropData(event, false)).toEqual(payload);
  });

  it('should return empty object for unknown MIME type on internal drag', () => {
    const event = {
      dataTransfer: {
        types: ['text/plain'],
        getData: vi.fn(() => ''),
      },
    } as unknown as DragEvent;

    expect(getDropData(event, false)).toEqual({});
  });

  it('should return empty object for external drag with unknown MIME type', () => {
    const event = {
      dataTransfer: {
        types: ['text/plain'],
        getData: vi.fn(() => ''),
      },
    } as unknown as DragEvent;

    expect(getDropData(event, true)).toEqual({});
  });

  it('should parse data for external drag with custom MIME type', () => {
    const payload = { data: 'ext' };
    const mimeType = CUSTOM_MIME_TYPE;
    const event = {
      dataTransfer: {
        types: [mimeType],
        getData: vi.fn(() => JSON.stringify(payload)),
      },
    } as unknown as DragEvent;

    expect(getDropData(event, true)).toEqual(payload);
  });

  it('should ignore malformed custom drag data', () => {
    const event = {
      dataTransfer: {
        types: [CUSTOM_MIME_TYPE],
        getData: vi.fn(() => '{invalid json'),
      },
    } as unknown as DragEvent;

    expect(getDropData(event, true)).toEqual({});
  });

  it.each([
    ['null', 'null'],
    ['an array', '[]'],
    ['a primitive', '42'],
  ])('should ignore custom drag data that is %s', (_description, payload) => {
    const event = {
      dataTransfer: {
        types: [CUSTOM_MIME_TYPE],
        getData: vi.fn(() => payload),
      },
    } as unknown as DragEvent;

    expect(getDropData(event, true)).toEqual({});
  });

  it('should ignore malformed custom data from an internal drag', () => {
    const event = {
      dataTransfer: {
        types: [CUSTOM_MIME_TYPE],
        getData: vi.fn(() => '{invalid json'),
      },
    } as unknown as DragEvent;

    expect(getDropData(event, false)).toEqual({});
  });

  it('should ignore custom drag data when reading it fails', () => {
    const event = {
      dataTransfer: {
        types: [CUSTOM_MIME_TYPE],
        getData: vi.fn(() => {
          throw new Error('DataTransfer read failed');
        }),
      },
    } as unknown as DragEvent;

    expect(getDropData(event, true)).toEqual({});
  });
});

describe('getDirectChildElement', () => {
  it('should return the direct child', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    const grandchild = document.createElement('a');
    parent.appendChild(child);
    child.appendChild(grandchild);

    expect(getDirectChildElement(parent, grandchild)).toBe(child);
  });

  it('should return the element itself when it is a direct child', () => {
    const parent = document.createElement('div');
    const child = document.createElement('span');
    parent.appendChild(child);

    expect(getDirectChildElement(parent, child)).toBe(child);
  });

  it('should return null when parent is not an ancestor', () => {
    const parent = document.createElement('div');
    const unrelated = document.createElement('span');

    expect(getDirectChildElement(parent, unrelated)).toBeNull();
  });
});

describe('shouldPositionPlaceholderBeforeElement', () => {
  it('should return true when cursor is in upper half (vertical)', () => {
    const element = document.createElement('div');
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      height: 50,
      left: 0,
      width: 100,
    } as DOMRect);

    const event = { clientY: 110, clientX: 0 } as DragEvent;
    expect(shouldPositionPlaceholderBeforeElement(event, element, false)).toBe(
      true
    );
  });

  it('should return false when cursor is in lower half (vertical)', () => {
    const element = document.createElement('div');
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 100,
      height: 50,
      left: 0,
      width: 100,
    } as DOMRect);

    const event = { clientY: 140, clientX: 0 } as DragEvent;
    expect(shouldPositionPlaceholderBeforeElement(event, element, false)).toBe(
      false
    );
  });

  it('should return true when cursor is in left half (horizontal)', () => {
    const element = document.createElement('div');
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 50,
      left: 100,
      width: 100,
    } as DOMRect);

    const event = { clientX: 120, clientY: 0 } as DragEvent;
    expect(shouldPositionPlaceholderBeforeElement(event, element, true)).toBe(
      true
    );
  });

  it('should return false when cursor is in right half (horizontal)', () => {
    const element = document.createElement('div');
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 50,
      left: 100,
      width: 100,
    } as DOMRect);

    const event = { clientX: 180, clientY: 0 } as DragEvent;
    expect(shouldPositionPlaceholderBeforeElement(event, element, true)).toBe(
      false
    );
  });

  it('should use the parent layout direction for horizontal positioning', () => {
    const parent = document.createElement('div');
    parent.style.direction = 'rtl';
    const element = document.createElement('div');
    element.style.direction = 'ltr';
    parent.appendChild(element);
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 50,
      left: 100,
      width: 100,
    } as DOMRect);

    const event = { clientX: 180, clientY: 0 } as DragEvent;
    expect(shouldPositionPlaceholderBeforeElement(event, element, true)).toBe(
      true
    );
  });

  it('should position after the child in the left half of an RTL layout', () => {
    const parent = document.createElement('div');
    parent.style.direction = 'rtl';
    const element = document.createElement('div');
    parent.appendChild(element);
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 50,
      left: 100,
      width: 100,
    } as DOMRect);

    const event = { clientX: 120, clientY: 0 } as DragEvent;
    expect(shouldPositionPlaceholderBeforeElement(event, element, true)).toBe(
      false
    );
  });

  it('should ignore an RTL child inside an LTR parent layout', () => {
    const parent = document.createElement('div');
    parent.style.direction = 'ltr';
    const element = document.createElement('div');
    element.style.direction = 'rtl';
    parent.appendChild(element);
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 50,
      left: 100,
      width: 100,
    } as DOMRect);

    const event = { clientX: 120, clientY: 0 } as DragEvent;
    expect(shouldPositionPlaceholderBeforeElement(event, element, true)).toBe(
      true
    );
  });

  it('should use the right-half behavior of an explicit LTR parent', () => {
    const parent = document.createElement('div');
    parent.style.direction = 'ltr';
    const element = document.createElement('div');
    element.style.direction = 'rtl';
    parent.appendChild(element);
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 50,
      left: 100,
      width: 100,
    } as DOMRect);

    const event = { clientX: 180, clientY: 0 } as DragEvent;
    expect(shouldPositionPlaceholderBeforeElement(event, element, true)).toBe(
      false
    );
  });

  it('should use an explicit RTL direction on a parentless element', () => {
    const element = document.createElement('div');
    element.style.direction = 'rtl';
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 50,
      left: 100,
      width: 100,
    } as DOMRect);

    const event = { clientX: 180, clientY: 0 } as DragEvent;
    expect(shouldPositionPlaceholderBeforeElement(event, element, true)).toBe(
      true
    );
  });

  it('should fall back to LTR when the owner document has no window', () => {
    const detachedDocument = document.implementation.createHTMLDocument();
    const parent = detachedDocument.createElement('div');
    const element = detachedDocument.createElement('div');
    parent.appendChild(element);
    vi.spyOn(element, 'getBoundingClientRect').mockReturnValue({
      top: 0,
      height: 50,
      left: 100,
      width: 100,
    } as DOMRect);

    const event = { clientX: 120, clientY: 0 } as DragEvent;
    expect(shouldPositionPlaceholderBeforeElement(event, element, true)).toBe(
      true
    );
  });
});

describe('calculateDragImageOffset', () => {
  it('should calculate offset with padding and border', () => {
    const element = document.createElement('div');
    vi.spyOn(window, 'getComputedStyle').mockReturnValue({
      paddingTop: '10px',
      paddingLeft: '5px',
      borderTopWidth: '2px',
      borderLeftWidth: '3px',
    } as CSSStyleDeclaration);

    const event = { offsetX: 20, offsetY: 30 } as DragEvent;
    const result = calculateDragImageOffset(event, element);

    expect(result).toEqual({ x: 28, y: 42 });
  });
});

describe('setDragImage', () => {
  it('should call setDragImage on dataTransfer with offset', () => {
    const setDragImageFn = vi.fn();
    const event = {
      dataTransfer: { setDragImage: setDragImageFn },
    } as unknown as DragEvent;
    const element = document.createElement('div');
    const offsetFn = vi.fn().mockReturnValue({ x: 10, y: 20 });

    setDragImage(event, element, offsetFn);

    expect(offsetFn).toHaveBeenCalledWith(event, element);
    expect(setDragImageFn).toHaveBeenCalledWith(element, 10, 20);
  });
});
