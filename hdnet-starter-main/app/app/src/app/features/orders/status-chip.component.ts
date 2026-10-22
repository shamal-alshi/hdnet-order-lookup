import { Component, computed, input } from '@angular/core';
import { OrderStatus } from '../../shared/models';


@Component({
  selector: 'app-status-chip',
  template: `
    <span class="status-chip" [attr.data-status]="status()">
      {{ label() }}
    </span>
  `,
  styles: `
    .status-chip {
      display: inline-flex;
      align-items: center;
      min-height: 1.75rem;
      padding: 0 0.65rem;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 750;
      letter-spacing: 0.04em;
      white-space: nowrap;
    }

    [data-status='RECEIVED'] {
      background: #dbeafe;
      color: #1d4ed8;
    }

    [data-status='PROCESSING'] {
      background: #fef3c7;
      color: #92400e;
    }

    [data-status='SENT_TO_PHARMACY'] {
      background: #ede9fe;
      color: #6d28d9;
    }

    [data-status='SHIPPED'] {
      background: #cffafe;
      color: #0e7490;
    }

    [data-status='DELIVERED'] {
      background: #dcfce7;
      color: #15803d;
    }

    [data-status='CANCELLED'] {
      background: #fee2e2;
      color: #b91c1c;
    }
  `,
})
export class StatusChipComponent {
  readonly status = input.required<OrderStatus>();

  protected readonly label = computed(() =>
    this.status().replaceAll('_', ' '),
  );
}
