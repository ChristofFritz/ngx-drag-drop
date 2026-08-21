import { Component, signal } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  DndDraggableDirective,
  DndDropEvent,
  DndDropzoneDirective,
  DndPlaceholderRefDirective,
} from 'ngx-drag-drop';

interface Tile {
  id: number;
  label: string;
}

function createTiles(): Tile[] {
  return Array.from({ length: 11 }, (_, index) => ({
    id: index + 1,
    label: `Tile ${index + 1}`,
  }));
}

@Component({
  selector: 'dnd-issue-157',
  templateUrl: './issue-157.component.html',
  styleUrl: './issue-157.component.scss',
  standalone: true,
  imports: [
    DndDraggableDirective,
    DndDropzoneDirective,
    DndPlaceholderRefDirective,
    MatButtonModule,
    MatCardModule,
    MatIconModule,
    MatSlideToggleModule,
  ],
})
export default class Issue157Component {
  protected readonly hideDraggingSource = signal(true);
  protected readonly dragging = signal(false);
  protected readonly status = signal('Drag a tile slowly across the grid.');
  protected readonly tiles = signal(createTiles());

  protected onDrop(event: DndDropEvent): void {
    if (event.index === undefined || !event.data) {
      return;
    }

    const tiles = [...this.tiles()];
    const dragged = event.data as Tile;
    const sourceIndex = tiles.findIndex(tile => tile.id === dragged.id);
    if (sourceIndex === -1) {
      return;
    }

    const [tile] = tiles.splice(sourceIndex, 1);
    const targetIndex =
      sourceIndex < event.index ? event.index - 1 : event.index;
    tiles.splice(targetIndex, 0, tile);
    this.tiles.set(tiles);
    this.status.set(`${tile.label} dropped at index ${targetIndex}.`);
  }

  protected onDragStart(tile: Tile): void {
    this.dragging.set(true);
    this.status.set(
      this.hideDraggingSource()
        ? `${tile.label}: dragging source hidden from layout.`
        : `${tile.label}: dragging source remains visible.`
    );
  }

  protected onDragEnd(): void {
    this.dragging.set(false);
  }

  protected reset(): void {
    this.tiles.set(createTiles());
    this.status.set('Grid reset. Drag a tile slowly across the grid.');
  }
}
