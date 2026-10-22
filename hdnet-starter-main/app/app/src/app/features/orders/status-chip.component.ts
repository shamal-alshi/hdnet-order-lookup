import { Component, computed, input } from '@angular/core';
import { OrderStatus } from '../../shared/models';


@Component({
  selector: 'app-status-chip',
  template: `
    <span class="status-chip" [attr.data-status]="status()">
      <span class="status-dot" aria-hidden="true"></span>
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

    .status-dot {
      width: 0.38rem;
      height: 0.38rem;
      margin-right: 0.42rem;
      border-radius: 50%;
      background: currentcolor;
    }

    [data-status='RECEIVED'] {
      background: #dff5ef;
      color: #087f70;
    }

    [data-status='PROCESSING'] {
      background: #fff1cf;
      color: #9a6100;
    }

    [data-status='SENT_TO_PHARMACY'] {
      background: #ebe9fc;
      color: #5947a8;
    }

    [data-status='SHIPPED'] {
      background: #dceff5;
      color: #07647e;
    }

    [data-status='DELIVERED'] {
      background: #def5e6;
      color: #247344;
    }

    [data-status='CANCELLED'] {
      background: #fae4e4;
      color: #a82a2a;
    }
  `,
})
export class StatusChipComponent {
  readonly status = input.required<OrderStatus>();

  protected readonly label = computed(() =>
    this.status().replaceAll('_', ' '),
  );
}
