[![npm](https://img.shields.io/npm/v/ngx-drag-drop.svg)](https://www.npmjs.com/package/ngx-drag-drop)
[![npm (next)](https://img.shields.io/npm/v/ngx-drag-drop/next.svg)](https://www.npmjs.com/package/ngx-drag-drop)
[![NpmLicense](https://img.shields.io/npm/l/ngx-drag-drop.svg)](https://www.npmjs.com/package/ngx-drag-drop)
[![GitHub issues](https://img.shields.io/github/issues/ChristofFritz/ngx-drag-drop.svg)](https://github.com/ChristofFritz/ngx-drag-drop/issues)
[![Twitter](https://img.shields.io/twitter/url/https/github.com/ChristofFritz/ngx-drag-drop.svg?style=social)](https://twitter.com/intent/tweet?text=Angular%20drag%20and%20drop%20with%20ease:&url=https://github.com/ChristofFritz/ngx-drag-drop)

# NgxDragDrop

[_Demo_](https://christoffritz.github.io/ngx-drag-drop/) / [_StackBlitz Issue
Template_](https://stackblitz.com/edit/ngx-drag-drop-issue-template)

```sh
npm install ngx-drag-drop
# or
pnpm add ngx-drag-drop
```

**Angular directives for declarative drag and drop using the HTML5 Drag-And-Drop API**

- sortable lists by using placeholder element (vertical and horizontal)
- nestable
- dropzones optionally support external/native draggables (img, txt, file)
- conditional drag/drop
- typed drag/drop
- utilize [EffectAllowed](https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/effectAllowed)
- custom CSS classes
- touch support by using a [polyfill](#touch-support)
- [AOT](https://angular.io/guide/aot-compiler) compatible

Port of [angular-drag-drop-lists](https://github.com/marceljuenemann/angular-drag-and-drop-lists) but without the lists :wink:

This has `dropzones` though :+1:
The idea is that the directive does not handle lists internally so the `dndDropzone` can be general purpose.

## Angular Version Compatibility

Starting with v13, the library major version matches the Angular major version.

| Angular | ngx-drag-drop |
| ------- | ------------- |
| 21.x    | 21.x          |
| 20.x    | 20.x          |
| 19.x    | 19.x          |
| 18.x    | 18.x          |
| 17.x    | 17.x          |
| 16.x    | 16.x          |
| 15.x    | 15.x          |
| 14.x    | 14.x          |
| 13.x    | 13.x          |

For older Angular versions (v4–v12), use ngx-drag-drop v2.x.

## Usage

`app.component.html`

```HTML
<!--a draggable element-->
<div
  [dndDraggable]="draggable.data"
  [dndEffectAllowed]="draggable.effectAllowed"
  [dndDisableIf]="draggable.disable"
  [dndHideDraggingSource]="true"
  (dndStart)="onDragStart($event)"
  (dndCopied)="onDraggableCopied($event)"
  (dndLinked)="onDraggableLinked($event)"
  (dndMoved)="onDraggableMoved($event)"
  (dndCanceled)="onDragCanceled($event)"
  (dndEnd)="onDragEnd($event)">

  <!--if [dndHandle] is used inside dndDraggable drag can only start from the handle-->
  <div
    *ngIf="draggable.handle"
    dndHandle>HANDLE
  </div>

  draggable ({{draggable.effectAllowed}}) <span [hidden]="!draggable.disable">DISABLED</span>

  <!--optionally select a child element as drag image-->
  <div dndDragImageRef>DRAG_IMAGE</div>

</div>

<!--a dropzone-->
<!--to allow dropping content that is not [dndDraggable] set dndAllowExternal to true-->
<section
  dndDropzone
  (dndDragover)="onDragover($event)"
  (dndDrop)="onDrop($event)">

  dropzone

  <!--optional placeholder element for dropzone-->
  <!--will be removed from DOM on init-->
  <div
    style="border: 1px orangered solid; border-radius: 5px; padding: 15px;"
    dndPlaceholderRef>
    placeholder
  </div>

</section>
```

Set `[dndHideDraggingSource]="true"` when the original element should not remain
in the layout while its drag image follows the pointer. This is useful for
sortable lists, grids, and nested layouts. The source is hidden only after the
browser captures the drag image, and its original inline `display` value is
restored when dragging ends.

`app.component`

```JS
import {Component} from '@angular/core';

import {DndDropEvent} from 'ngx-drag-drop';

@Component()
export class AppComponent {

  draggable = {
    // note that data is handled with JSON.stringify/JSON.parse
    // only set simple data or POJO's as methods will be lost
    data: "myDragData",
    effectAllowed: "all",
    disable: false,
    handle: false
  };

  onDragStart(event: DragEvent) {

    console.log("drag started", JSON.stringify(event, null, 2));
  }

  onDragEnd(event: DragEvent) {

    console.log("drag ended", JSON.stringify(event, null, 2));
  }

  onDraggableCopied(event: DragEvent) {

    console.log("draggable copied", JSON.stringify(event, null, 2));
  }

  onDraggableLinked(event: DragEvent) {

    console.log("draggable linked", JSON.stringify(event, null, 2));
  }

  onDraggableMoved(event: DragEvent) {

    console.log("draggable moved", JSON.stringify(event, null, 2));
  }

  onDragCanceled(event: DragEvent) {

    console.log("drag cancelled", JSON.stringify(event, null, 2));
  }

  onDragover(event: DragEvent) {

    console.log("dragover", JSON.stringify(event, null, 2));
  }

  onDrop(event: DndDropEvent) {

    console.log("dropped", JSON.stringify(event, null, 2));
  }
}
```

`app.module`

```JS
import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {DndModule} from 'ngx-drag-drop';

import {AppComponent} from './app.component';

@NgModule({
  declarations: [
    AppComponent
  ],
  imports: [
    BrowserModule,
    DndModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
```

## API

```TS
// https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/dropEffect
export type DropEffect = "move" | "copy" | "link" | "none";

// https://developer.mozilla.org/en-US/docs/Web/API/DataTransfer/effectAllowed
export type EffectAllowed = DropEffect | "copyMove" | "copyLink" | "linkMove" | "all";
```

```TS
export type DndDragImageOffsetFunction = ( event:DragEvent, dragImage:Element ) => { x:number, y:number };

@Directive( {
  selector: "[dndDraggable]"
} )
export declare class DndDraggableDirective {

    // the data attached to the drag
    dndDraggable: any;

    // the allowed drop effect
    dndEffectAllowed: EffectAllowed;

    // optionally set the type of dragged data to restrict dropping on compatible dropzones
    dndType?: string;

    // conditionally disable the draggability
    dndDisableIf: boolean;
    dndDisableDragIf: boolean;

    // set a custom class that is applied while dragging
    dndDraggingClass: string = "dndDragging";

    // set a custom class that is applied to only the src element while dragging
    dndDraggingSourceClass: string = "dndDraggingSource";

    // remove the source element from layout after the browser captures the drag image
    dndHideDraggingSource: boolean = false;

    // set the class that is applied when draggable is disabled by [dndDisableIf]
    dndDraggableDisabledClass = "dndDraggableDisabled";

    // enables to set a function for calculating custom dragimage offset
    dndDragImageOffsetFunction:DndDragImageOffsetFunction = calculateDragImageOffset;

    // emits on drag start
    readonly dndStart: EventEmitter<DragEvent>;

    // emits on drag
    readonly dndDrag: EventEmitter<DragEvent>;

    // emits on drag end
    readonly dndEnd: EventEmitter<DragEvent>;

    // emits when the dragged item has been dropped with effect "move"
    readonly dndMoved: EventEmitter<DragEvent>;

    // emits when the dragged item has been dropped with effect "copy"
    readonly dndCopied: EventEmitter<DragEvent>;

    // emits when the dragged item has been dropped with effect "link"
    readonly dndLinked: EventEmitter<DragEvent>;

    // emits when the drag is canceled
    readonly dndCanceled: EventEmitter<DragEvent>;
}
```

```TS
export interface DndDropEvent {

    // the original drag event
    event: DragEvent;

    // the actual drop effect
    dropEffect: DropEffect;

    // true if the drag did not origin from a [dndDraggable]
    isExternal:boolean;

    // the data set on the [dndDraggable] that started the drag
    // for external drags use the event property which contains the original drop event as this will be undefined
    data?: any;

    // the index where the draggable was dropped in a dropzone
    // set only when using a placeholder
    index?: number;

    // if the dndType input on dndDraggable was set
    // it will be transported here
    type?: any;
}

@Directive( {
  selector: "[dndDropzone]"
} )
export declare class DndDropzoneDirective {

    // optionally restrict the allowed types
    dndDropzone?: string[];

    // set the allowed drop effect
    dndEffectAllowed: EffectAllowed;

    // conditionally disable the dropzone
    dndDisableIf: boolean;
    dndDisableDropIf: boolean;

    // if draggables that are not [dndDraggable] are allowed to be dropped
    // set to true if dragged text, images or files should be handled
    dndAllowExternal: boolean;

    // if its a horizontal list this influences how the placeholder position
    // is calculated
    dndHorizontal: boolean;

    // set the class applied to the dropzone
    // when a draggable is dragged over it
    dndDragoverClass: string = "dndDragover";

    // set the class applied to the dropzone
    // when the dropzone is disabled by [dndDisableIf]
    dndDropzoneDisabledClass = "dndDropzoneDisabled";

    // emits when a draggable is dragged over the dropzone
    readonly dndDragover: EventEmitter<DragEvent>;

    // emits on successful drop
    readonly dndDrop: EventEmitter<DndDropEvent>;
}
```

## Touch support

Install the `mobile-drag-drop` module available on npm.

Add the following lines to your js code

```JS
import { polyfill } from 'mobile-drag-drop';
// optional import of scroll behaviour
import { scrollBehaviourDragImageTranslateOverride } from "mobile-drag-drop/scroll-behaviour";

polyfill( {
  // use this to make use of the scroll behaviour
  dragImageTranslateOverride: scrollBehaviourDragImageTranslateOverride
} );

// workaround to make scroll prevent work in iOS Safari > 10
try {
  window.addEventListener( "touchmove", function() { }, { passive: false } );
}
catch(e){}
```

For more info on the polyfill check it out on GitHub
https://github.com/timruffles/mobile-drag-drop

## Known issues

### Firefox

- Beware that Firefox does not support dragging on `<button>` elements.
  - `<button [dndDraggable]>` and `<button [dndHandler]>` won't work.
  - See https://bugzilla.mozilla.org/show_bug.cgi?id=568313

## Why?

HTML Drag-And-Drop API implementations are not behaving the same way across browsers.

The directives contained in this module enable declarative drag and drop that "just works" across browsers in a consistent way.

Credits go to the author and contributors of [angular-drag-drop-lists](https://github.com/marceljuenemann/angular-drag-and-drop-lists).
