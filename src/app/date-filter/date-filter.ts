import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatInputModule } from '@angular/material/input';
import { DataService, RangeKey } from '../data.service';

interface Chip {
  key: RangeKey;
  label: string;
}

/** Convert a Date to a local YYYY-MM-DD string. */
function toIso(d: Date | null): string {
  if (!d) return '';
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Parse a YYYY-MM-DD string to a local Date (or null). */
function fromIso(s: string): Date | null {
  if (!s) return null;
  const [y, m, d] = s.split('-').map(Number);
  return y && m && d ? new Date(y, m - 1, d) : null;
}

@Component({
  selector: 'app-date-filter',
  imports: [MatIconModule, MatFormFieldModule, MatDatepickerModule, MatInputModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './date-filter.html',
  styleUrl: './date-filter.scss',
})
export class DateFilter {
  private readonly data = inject(DataService);
  readonly range = this.data.range;

  readonly chips: Chip[] = [
    { key: 'all', label: 'Cały czas' },
    { key: 'month', label: 'Ostatni miesiąc' },
    { key: '3months', label: 'Ostatnie 3 miesiące' },
    { key: 'year', label: 'Ten rok' },
    { key: 'custom', label: 'Zakres' },
  ];

  select(key: RangeKey): void {
    this.data.range.set(key);
  }

  get startDate(): Date | null {
    return fromIso(this.data.from());
  }
  get endDate(): Date | null {
    return fromIso(this.data.to());
  }

  onStart(d: Date | null): void {
    this.data.from.set(toIso(d));
    this.data.range.set('custom');
  }
  onEnd(d: Date | null): void {
    this.data.to.set(toIso(d));
    this.data.range.set('custom');
  }
}
