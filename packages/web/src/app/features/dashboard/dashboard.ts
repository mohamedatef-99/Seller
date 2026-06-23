import { Component, inject, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { OrderStatus, type DashboardResponse, type OrderDto } from '@cod/shared';
import { ApiService } from '../../core/api';
import { AuthService } from '../../core/auth';
import {
  COD_STATUS_CHIP,
  COD_STATUS_LABEL,
  ORDER_STATUS_CHIP,
  ORDER_STATUS_LABEL,
  egp,
} from '../../core/labels';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="mx-auto max-w-md min-h-screen pb-24">
      <!-- Header -->
      <header
        class="sticky top-0 z-10 bg-brand-700 text-white px-4 pt-4 pb-3 flex items-center justify-between"
      >
        <div>
          <p class="text-brand-100 text-xs">أهلاً</p>
          <h1 class="font-bold text-lg leading-tight">
            {{ auth.seller()?.businessName ?? 'متجري' }}
          </h1>
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="sync()"
            [disabled]="syncing()"
            class="text-brand-100 text-sm rounded-lg px-3 py-1.5 bg-brand-600/60 hover:bg-brand-600 disabled:opacity-60"
          >
            {{ syncing() ? '...' : 'تحديث الحالة' }}
          </button>
          <a
            routerLink="/products"
            class="text-brand-100 text-sm rounded-lg px-3 py-1.5 bg-brand-600/60 hover:bg-brand-600"
          >
            المنتجات
          </a>
          <a
            routerLink="/settings"
            class="text-brand-100 text-sm rounded-lg px-3 py-1.5 bg-brand-600/60 hover:bg-brand-600"
          >
            الإعدادات
          </a>
          <button
            (click)="logout()"
            class="text-brand-100 text-sm rounded-lg px-3 py-1.5 bg-brand-600/60 hover:bg-brand-600"
          >
            خروج
          </button>
        </div>
      </header>

      @if (syncMsg()) {
        <div class="px-4 mt-2">
          <p class="text-xs text-center text-slate-500 bg-slate-100 rounded-lg py-1.5">
            {{ syncMsg() }}
          </p>
        </div>
      }

      @if (loading()) {
        <div class="p-8 text-center text-slate-400">...جارٍ التحميل</div>
      } @else if (error()) {
        <div class="p-6 text-center">
          <p class="text-rose-600 mb-3">تعذّر تحميل البيانات</p>
          <button
            (click)="reload()"
            class="rounded-xl bg-brand-600 text-white px-4 py-2 text-sm"
          >
            إعادة المحاولة
          </button>
        </div>
      } @else {
        @if (data(); as d) {
        <main class="px-4 -mt-1 space-y-5">
          <!-- HERO: money the courier is holding for you right now -->
          <section
            class="rounded-3xl bg-white shadow-sm border border-brand-100 p-5 mt-4"
          >
            <p class="text-slate-500 text-sm mb-1">
              فلوس عندك عند شركة الشحن دلوقتي
            </p>
            <p class="num text-4xl font-extrabold text-brand-700">
              {{ money(d.summary.codStillOwed) }}
            </p>
            <p class="text-xs text-slate-400 mt-1">
              تم تحصيلها من العملاء ولم تُحوَّل لك بعد
            </p>
          </section>

          <!-- Secondary money + counts -->
          <section class="grid grid-cols-2 gap-3">
            <div class="rounded-2xl bg-white border border-slate-100 p-4">
              <p class="text-xs text-slate-500">في الطريق (متوقّع)</p>
              <p class="num text-xl font-bold mt-1">
                {{ money(d.summary.codInTransit) }}
              </p>
            </div>
            <div class="rounded-2xl bg-white border border-slate-100 p-4">
              <p class="text-xs text-slate-500">وصلك بالفعل</p>
              <p class="num text-xl font-bold mt-1 text-emerald-700">
                {{ money(d.summary.codSettled) }}
              </p>
            </div>
            <div class="rounded-2xl bg-white border border-slate-100 p-4">
              <p class="text-xs text-slate-500">شحنات في الخارج</p>
              <p class="num text-xl font-bold mt-1">{{ d.summary.ordersOut }}</p>
            </div>
            <div class="rounded-2xl bg-white border border-slate-100 p-4">
              <p class="text-xs text-slate-500">تم تسليمها</p>
              <p class="num text-xl font-bold mt-1">{{ d.summary.delivered }}</p>
            </div>
          </section>

          <!-- Orders -->
          <section>
            <h2 class="font-bold text-slate-700 mb-2 px-1">الطلبات</h2>
            <div class="space-y-2.5">
              @for (o of d.orders; track o.id) {
                <article
                  class="rounded-2xl bg-white border border-slate-100 p-4"
                >
                  <div class="flex items-start justify-between gap-3">
                    <div class="min-w-0">
                      <p class="font-semibold truncate">{{ o.customerName }}</p>
                      <p class="text-xs text-slate-400 mt-0.5">
                        {{ o.governorate }} ·
                        <span class="num">{{ o.customerPhone }}</span>
                      </p>
                    </div>
                    <span
                      class="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full"
                      [class]="orderChip(o)"
                    >
                      {{ orderLabel(o) }}
                    </span>
                  </div>

                  <div
                    class="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between"
                  >
                    <div class="flex items-center gap-2">
                      <span
                        class="text-xs px-2 py-0.5 rounded-full"
                        [class]="codChip(o)"
                      >
                        {{ codLabel(o) }}
                      </span>
                      @if (o.trackingNumber) {
                        <span class="num text-xs text-slate-400">{{
                          o.trackingNumber
                        }}</span>
                      }
                    </div>
                    <p class="num font-bold">{{ money(o.codAmount) }}</p>
                  </div>

                  @if (canPush(o)) {
                    <button
                      type="button"
                      (click)="push(o)"
                      [disabled]="pushingId() === o.id"
                      class="mt-3 w-full rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-semibold py-2.5 disabled:opacity-60"
                    >
                      {{ pushingId() === o.id ? '...جارٍ الإرسال' : 'إرسال للشحن (Bosta)' }}
                    </button>
                  }
                </article>
              }
            </div>
          </section>
        </main>
        }
      }

      <!-- Fast order entry -->
      <a
        routerLink="/orders/new"
        class="fixed bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 rounded-full bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3.5 shadow-lg shadow-brand-600/30"
      >
        <span class="text-xl leading-none">+</span>
        طلب جديد
      </a>
    </div>
  `,
})
export class DashboardComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  readonly auth = inject(AuthService);

  readonly data = signal<DashboardResponse | null>(null);
  readonly loading = signal(true);
  readonly error = signal(false);
  readonly pushingId = signal<string | null>(null);
  readonly syncing = signal(false);
  readonly syncMsg = signal<string | null>(null);

  readonly money = egp;

  constructor() {
    this.reload();
  }

  // Pull latest status from Bosta for active orders, then refresh the view.
  async sync(): Promise<void> {
    if (this.syncing()) return;
    this.syncing.set(true);
    this.syncMsg.set(null);
    try {
      const res = await firstValueFrom(this.api.syncOrders());
      this.data.set(await firstValueFrom(this.api.getDashboard()));
      this.syncMsg.set(
        res.updated > 0
          ? `تم تحديث ${res.updated} من ${res.synced} طلب`
          : `لا تغييرات (${res.synced} طلب نشط)`,
      );
    } catch {
      this.syncMsg.set('تعذّر التحديث، حاول مرة أخرى');
    } finally {
      this.syncing.set(false);
    }
  }

  canPush(o: OrderDto): boolean {
    return o.status === OrderStatus.NEW;
  }

  // One-tap push to courier, then silently refresh so the money tiles + status
  // reflect the move from NEW -> PENDING (now counted as "out for delivery").
  async push(o: OrderDto): Promise<void> {
    if (this.pushingId()) return;
    this.pushingId.set(o.id);
    try {
      await firstValueFrom(this.api.pushToCourier(o.id));
      this.data.set(await firstValueFrom(this.api.getDashboard()));
    } catch {
      this.error.set(true);
    } finally {
      this.pushingId.set(null);
    }
  }

  async reload(): Promise<void> {
    this.loading.set(true);
    this.error.set(false);
    try {
      this.data.set(await firstValueFrom(this.api.getDashboard()));
    } catch {
      this.error.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  orderLabel(o: OrderDto): string {
    return ORDER_STATUS_LABEL[o.status];
  }
  orderChip(o: OrderDto): string {
    return ORDER_STATUS_CHIP[o.status];
  }
  codLabel(o: OrderDto): string {
    return COD_STATUS_LABEL[o.cod.status];
  }
  codChip(o: OrderDto): string {
    return COD_STATUS_CHIP[o.cod.status];
  }

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }
}
