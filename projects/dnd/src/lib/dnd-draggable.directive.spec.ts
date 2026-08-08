import { Component, DebugElement, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  DndDraggableDirective,
  DndDragImageRefDirective,
} from './dnd-draggable.directive';
import { DndHandleDirective } from './dnd-handle.directive';
import { endDrag, dndState } from './dnd-state';

function createMockDragEvent(
  setData: (format: string, data: string) => void = vi.fn()
): DragEvent {
  return {
    dataTransfer: {
      types: [],
      effectAllowed: 'all',
      setData,
    },
    stopPropagation: vi.fn(),
  } as unknown as DragEvent;
}

@Component({
  standalone: true,
  imports: [DndDraggableDirective],
  template: `<div [dndDraggable]="'testData'" [dndEffectAllowed]="'copyMove'">
    drag me
  </div>`,
})
class BasicDraggableHost {}

@Component({
  standalone: true,
  imports: [DndDraggableDirective],
  template: `<div [dndDraggable]="'data'">drag me</div>`,
})
class DisabledDraggableHost {}

@Component({
  standalone: true,
  imports: [DndDraggableDirective, DndHandleDirective],
  template: `
    <div [dndDraggable]="'data'">
      <div dndHandle>handle</div>
      content
    </div>
  `,
})
class HandleDraggableHost {}

@Component({
  standalone: true,
  imports: [DndDraggableDirective, DndDragImageRefDirective],
  template: `
    <div [dndDraggable]="'data'">
      @if (showDragImage()) {
        <div dndDragImageRef>custom image</div>
      }
      @if (showSecondDragImage()) {
        <div dndDragImageRef>second custom image</div>
      }
      content
    </div>
  `,
})
class DragImageHost {
  showDragImage = signal(true);
  showSecondDragImage = signal(false);
}

describe('DndDraggableDirective', () => {
  let fixture: ComponentFixture<BasicDraggableHost>;
  let draggableEl: DebugElement;

  beforeEach(async () => {
    endDrag();
    await TestBed.configureTestingModule({
      imports: [BasicDraggableHost],
    }).compileComponents();

    fixture = TestBed.createComponent(BasicDraggableHost);
    fixture.detectChanges();
    draggableEl = fixture.debugElement.query(
      By.directive(DndDraggableDirective)
    );
  });

  it('should set draggable attribute to true', () => {
    expect(draggableEl.nativeElement.getAttribute('draggable')).toBe('true');
  });

  it('should have the directive instance', () => {
    const directive = draggableEl.injector.get(DndDraggableDirective);
    expect(directive).toBeTruthy();
    expect(directive.dndEffectAllowed).toBe('copyMove');
  });

  it('should clean up an active drag when disabled before dragend', () => {
    vi.useFakeTimers();
    const directive = draggableEl.injector.get(DndDraggableDirective);
    const endSpy = vi.spyOn(directive.dndEnd, 'emit');
    const canceledSpy = vi.spyOn(directive.dndCanceled, 'emit');
    const startEvent = createMockDragEvent();
    const endEvent = createMockDragEvent();

    directive.onDragStart(startEvent);
    expect(dndState.isDragging).toBe(true);
    expect(draggableEl.nativeElement.classList.contains('dndDragging')).toBe(
      true
    );
    draggableEl.nativeElement.dispatchEvent(new Event('drag'));
    expect(
      draggableEl.nativeElement.classList.contains('dndDraggingSource')
    ).toBe(true);

    directive.dndDisableIf = true;
    directive.onDragEnd(endEvent);

    expect(dndState.isDragging).toBe(false);
    expect((directive as any).isDragStarted).toBe(false);
    expect(endSpy).toHaveBeenCalledOnce();
    expect(endSpy).toHaveBeenCalledWith(endEvent);
    expect(canceledSpy).toHaveBeenCalledOnce();
    expect(canceledSpy).toHaveBeenCalledWith(endEvent);
    expect(endEvent.stopPropagation).toHaveBeenCalledOnce();
    expect(draggableEl.nativeElement.classList.contains('dndDragging')).toBe(
      false
    );
    expect(draggableEl.nativeElement.style.pointerEvents).toBe('unset');
    vi.runAllTimers();
    expect(
      draggableEl.nativeElement.classList.contains('dndDraggingSource')
    ).toBe(false);
    vi.useRealTimers();
  });

  it('should clean up drag state when drag data cannot be serialized', () => {
    const directive = draggableEl.injector.get(DndDraggableDirective);
    const startSpy = vi.spyOn(directive.dndStart, 'emit');
    const error = new Error('Serialization failed');
    const stringifySpy = vi
      .spyOn(JSON, 'stringify')
      .mockImplementationOnce(() => {
        throw error;
      });
    const event = createMockDragEvent();
    let thrown: unknown;

    try {
      directive.onDragStart(event);
    } catch (caught) {
      thrown = caught;
    } finally {
      stringifySpy.mockRestore();
    }

    expect(thrown).toBe(error);
    expect(dndState.isDragging).toBe(false);
    expect(dndState.dropEffect).toBeUndefined();
    expect(dndState.effectAllowed).toBeUndefined();
    expect(dndState.type).toBeUndefined();
    expect((directive as any).isDragStarted).toBe(false);
    expect(startSpy).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
  });

  it('should clean up drag state when DataTransfer rejects the data', () => {
    const directive = draggableEl.injector.get(DndDraggableDirective);
    const startSpy = vi.spyOn(directive.dndStart, 'emit');
    const error = new Error('DataTransfer rejected the data');
    const event = createMockDragEvent(
      vi.fn(() => {
        throw error;
      })
    );

    expect(() => directive.onDragStart(event)).toThrow(error);
    expect(dndState.isDragging).toBe(false);
    expect(dndState.dropEffect).toBeUndefined();
    expect(dndState.effectAllowed).toBeUndefined();
    expect(dndState.type).toBeUndefined();
    expect((directive as any).isDragStarted).toBe(false);
    expect(startSpy).not.toHaveBeenCalled();
    expect(event.stopPropagation).not.toHaveBeenCalled();
  });
});

describe('DndDraggableDirective - disabled', () => {
  let fixture: ComponentFixture<DisabledDraggableHost>;
  let directive: DndDraggableDirective;
  let draggableEl: DebugElement;

  beforeEach(async () => {
    endDrag();
    await TestBed.configureTestingModule({
      imports: [DisabledDraggableHost],
    }).compileComponents();

    fixture = TestBed.createComponent(DisabledDraggableHost);
    fixture.detectChanges();
    draggableEl = fixture.debugElement.query(
      By.directive(DndDraggableDirective)
    );
    directive = draggableEl.injector.get(DndDraggableDirective);
  });

  it('should set draggable to false when disabled', () => {
    directive.dndDisableIf = true;
    expect(directive.draggable).toBe(false);
    expect(
      draggableEl.nativeElement.classList.contains('dndDraggableDisabled')
    ).toBe(true);
  });

  it('should add disabled class when disabled', () => {
    directive.dndDisableIf = true;
    expect(
      draggableEl.nativeElement.classList.contains('dndDraggableDisabled')
    ).toBe(true);
  });

  it('should remove disabled class when re-enabled', () => {
    directive.dndDisableIf = true;
    directive.dndDisableIf = false;
    expect(directive.draggable).toBe(true);
    expect(
      draggableEl.nativeElement.classList.contains('dndDraggableDisabled')
    ).toBe(false);
  });
});

describe('DndDraggableDirective - handle', () => {
  let fixture: ComponentFixture<HandleDraggableHost>;

  beforeEach(async () => {
    endDrag();
    await TestBed.configureTestingModule({
      imports: [HandleDraggableHost],
    }).compileComponents();

    fixture = TestBed.createComponent(HandleDraggableHost);
    fixture.detectChanges();
  });

  it('should register the handle', () => {
    const draggableEl = fixture.debugElement.query(
      By.directive(DndDraggableDirective)
    );
    const directive = draggableEl.injector.get(DndDraggableDirective);
    // The handle registers itself on init — verify via the private field
    expect((directive as any).dndHandle).toBeTruthy();
  });
});

describe('DndDraggableDirective - drag image', () => {
  let fixture: ComponentFixture<DragImageHost>;

  beforeEach(async () => {
    endDrag();
    await TestBed.configureTestingModule({
      imports: [DragImageHost],
    }).compileComponents();

    fixture = TestBed.createComponent(DragImageHost);
    fixture.detectChanges();
  });

  it('should register the drag image element', () => {
    const draggableEl = fixture.debugElement.query(
      By.directive(DndDraggableDirective)
    );
    const directive = draggableEl.injector.get(DndDraggableDirective);
    expect((directive as any).dndDragImageElementRef).toBeTruthy();
  });

  it('should unregister the drag image element when it is destroyed', () => {
    const draggableEl = fixture.debugElement.query(
      By.directive(DndDraggableDirective)
    );
    const directive = draggableEl.injector.get(DndDraggableDirective);

    fixture.componentInstance.showDragImage.set(false);
    fixture.detectChanges();

    expect(
      fixture.debugElement.query(By.directive(DndDragImageRefDirective))
    ).toBeNull();
    expect((directive as any).dndDragImageElementRef).toBeUndefined();
  });

  it('should keep a newer drag image registered when an older one is destroyed', () => {
    const draggableEl = fixture.debugElement.query(
      By.directive(DndDraggableDirective)
    );
    const directive = draggableEl.injector.get(DndDraggableDirective);

    fixture.componentInstance.showSecondDragImage.set(true);
    fixture.detectChanges();
    const dragImages = fixture.debugElement.queryAll(
      By.directive(DndDragImageRefDirective)
    );
    const secondDragImage = dragImages[1].injector.get(
      DndDragImageRefDirective
    ).elementRef;

    fixture.componentInstance.showDragImage.set(false);
    fixture.detectChanges();

    expect((directive as any).dndDragImageElementRef).toBe(secondDragImage);

    const setDragImage = vi.fn();
    const event = {
      dataTransfer: {
        types: [],
        effectAllowed: 'all',
        setData: vi.fn(),
        setDragImage,
      },
      stopPropagation: vi.fn(),
    } as unknown as DragEvent;

    directive.onDragStart(event);

    expect(setDragImage).toHaveBeenCalledOnce();
    expect(setDragImage.mock.calls[0][0]).toBe(secondDragImage.nativeElement);

    directive.onDragEnd(event);
  });
});
