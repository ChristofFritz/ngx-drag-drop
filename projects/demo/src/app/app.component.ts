import { Component } from '@angular/core';
import { MatIconRegistry } from '@angular/material/icon';
import { DomSanitizer } from '@angular/platform-browser';
import { ActivatedRoute, ActivationEnd, Router } from '@angular/router';
import { filter, map, Observable, shareReplay, startWith } from 'rxjs';

const TABS: string[] = [
  'simple',
  'list',
  'nested',
  'tree',
  'native',
  'typed',
  'shadow-dom',
];

const ISSUE_DEMOS: { issue: number; label: string }[] = [
  { issue: 157, label: 'Dragging source visibility (#157)' },
  { issue: 195, label: '#195 — dropEffect ignores dropzone effectAllowed' },
];

const DEFAULT_TAB = TABS[0];

@Component({
  selector: 'dnd-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  standalone: false,
})
export class AppComponent {
  readonly title = 'NgxDragDrop Demo';

  readonly tabs: string[] = TABS;
  readonly issueDemos = ISSUE_DEMOS;
  readonly activeTab$: Observable<string>;

  constructor(
    sanitizer: DomSanitizer,
    iconRegistry: MatIconRegistry,
    activatedRoute: ActivatedRoute,
    private router: Router
  ) {
    iconRegistry.addSvgIcon(
      'github',
      sanitizer.bypassSecurityTrustResourceUrl('assets/github.svg')
    );

    this.activeTab$ = this.router.events.pipe(
      filter(event => event instanceof ActivationEnd),
      map(event => {
        const activationEnd = event as ActivationEnd;
        if (!!activationEnd?.snapshot?.url?.length) {
          return activationEnd?.snapshot?.url[0]?.path ?? DEFAULT_TAB;
        }
        return DEFAULT_TAB;
      }),
      startWith(DEFAULT_TAB),
      shareReplay(1)
    );
  }

  onTabLinkClick(tab: string) {
    this.router.navigate([tab]);
  }

  onIssueDemoClick(issue: number) {
    this.router.navigate(['issue', issue]);
  }
}
