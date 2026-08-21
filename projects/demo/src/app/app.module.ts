import {
  provideHttpClient,
  withInterceptorsFromDi,
} from '@angular/common/http';
import { NgModule } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatLineModule } from '@angular/material/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatListModule } from '@angular/material/list';
import { MatMenuModule } from '@angular/material/menu';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTabsModule } from '@angular/material/tabs';
import { MatToolbarModule } from '@angular/material/toolbar';
import { BrowserModule } from '@angular/platform-browser';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { RouterModule, Routes } from '@angular/router';
import { DndModule } from 'ngx-drag-drop';
import { AppComponent } from './app.component';
import { DemoLinkComponent } from './demo-link/demo-link.component';

const routes: Routes = [
  {
    path: 'simple',
    loadComponent: () => import('./simple/simple.component'),
  },
  {
    path: 'list',
    loadComponent: () => import('./list/list.component'),
  },
  {
    path: 'nested',
    loadComponent: () => import('./nested/nested.component'),
  },
  {
    path: 'tree',
    loadComponent: () => import('./tree/tree.component'),
  },
  {
    path: 'native',
    loadComponent: () => import('./native/native.component'),
  },
  {
    path: 'typed',
    loadComponent: () => import('./typed/typed.component'),
  },
  {
    path: 'shadow-dom',
    loadComponent: () => import('./shadow-dom/shadow-dom.component'),
  },
  {
    path: 'issue/157',
    loadComponent: () => import('./issue-157/issue-157.component'),
  },
  {
    path: 'issue/195',
    loadComponent: () => import('./issue-195/issue-195.component'),
  },
  {
    path: '**',
    pathMatch: 'full',
    redirectTo: 'simple',
  },
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule],
})
export class AppRoutingModule {}

@NgModule({
  declarations: [AppComponent],
  bootstrap: [AppComponent],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    DndModule,
    MatButtonModule,
    MatInputModule,
    MatToolbarModule,
    MatCardModule,
    MatSnackBarModule,
    MatSlideToggleModule,
    MatIconModule,
    MatMenuModule,
    MatTabsModule,
    AppRoutingModule,
    MatLineModule,
    MatListModule,
    DemoLinkComponent,
  ],
  providers: [provideHttpClient(withInterceptorsFromDi())],
})
export class AppModule {}
