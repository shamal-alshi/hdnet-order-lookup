import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthStore } from '../../../core/auth.store';


@Component({
  selector: 'app-orders-page',
  imports: [MatButtonModule, MatToolbarModule],
  templateUrl: './orders-page.html',
  styleUrl: './orders-page.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrdersPage {
  private readonly auth = inject(AuthStore);
  private readonly router = inject(Router);

  protected readonly user = this.auth.user;

  protected signOut(): void {
    this.auth.clearSession();
    void this.router.navigateByUrl('/login');
  }
}