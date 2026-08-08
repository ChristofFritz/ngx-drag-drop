import { Component, DebugElement, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  DndDraggableDirective,
  DndDragImageRefDirective,
} from './dnd-draggable.directive';
import { DndHandleDirective } from './dnd-handle.directive';
import { endDrag, dndState } from './dnd-state';

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
  });
});
