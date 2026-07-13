import { ChangeDetectionStrategy, Component } from '@angular/core';

interface Fact {
  icon: string;
  label: string;
  value: string;
}

@Component({
  selector: 'app-about-view',
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './about-view.html',
  styleUrl: './about-view.scss',
})
export class AboutView {
  readonly facts: Fact[] = [
    { icon: 'location_on', label: 'Mieszkam w', value: 'Warszawa' },
    { icon: 'topic', label: 'Tematy', value: 'Dziennikarstwo · Technologia · Polityka' },
    { icon: 'calendar_today', label: 'Od', value: '2016' },
  ];
}
