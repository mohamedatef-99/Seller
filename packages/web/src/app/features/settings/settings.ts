import { Component, computed, inject, signal } from '@angular/core';
import { SlicePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { BostaEnv } from '@cod/shared';
import { ApiService } from '../../core/api';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, RouterLink, SlicePipe],
  template: `
    <div class="mx-auto max-w-md min-h-screen pb-10">
      <header
        class="sticky top-0 z-10 bg-brand-700 text-white px-4 py-3 flex items-center gap-3"
      >
        <a routerLink="/dashboard" class="text-brand-100 text-xl leading-none">›</a>
        <h1 class="font-bold text-lg">الإعدادات</h1>
      </header>

      <main class="px-4 mt-4 space-y-5">
        <section class="bg-white rounded-2xl border border-slate-100 p-5">
          <div class="flex items-center justify-between mb-1">
            <h2 class="font-bold">ربط حساب Bosta</h2>
            @if (bosta()?.connected) {
              <span
                class="text-xs px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800"
              >
                متصل
              </span>
            } @else {
              <span
                class="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-500"
              >
                غير متصل
              </span>
            }
          </div>
          <p class="text-sm text-slate-500 mb-4">
            اربط حساب Bosta الخاص بك لإرسال الطلبات وتتبّع حالتها تلقائيًا.
            مفتاح الـ API يُحفظ مُشفّرًا ولا يظهر في المتصفح.
          </p>

          @if (bosta()?.connected) {
            <div class="rounded-xl bg-slate-50 p-3 text-sm space-y-1 mb-4">
              <div class="flex justify-between">
                <span class="text-slate-500">البيئة</span>
                <span class="font-medium">{{ envLabel(bosta()!.env) }}</span>
              </div>
              @if (bosta()?.connectedAt) {
                <div class="flex justify-between">
                  <span class="text-slate-500">تاريخ الربط</span>
                  <span class="num">{{ bosta()!.connectedAt | slice: 0 : 10 }}</span>
                </div>
              }
            </div>
            <button
              type="button"
              (click)="disconnect()"
              [disabled]="busy()"
              class="w-full rounded-xl bg-rose-50 text-rose-700 font-semibold py-2.5 disabled:opacity-50"
            >
              {{ busy() ? '...' : 'فصل الحساب' }}
            </button>
          } @else {
            <div class="space-y-3">
              <div>
                <label class="block text-sm font-medium mb-1">مفتاح Bosta API</label>
                <input
                  name="apiKey"
                  [(ngModel)]="apiKey"
                  dir="ltr"
                  class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-start focus:outline-none focus:ring-2 focus:ring-brand-500"
                  placeholder="الصق المفتاح من لوحة تحكم Bosta"
                />
              </div>
              <div>
                <label class="block text-sm font-medium mb-1">البيئة</label>
                <select
                  name="env"
                  [(ngModel)]="env"
                  class="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
                >
                  <option value="staging">تجريبية (Staging)</option>
                  <option value="production">إنتاج (Production)</option>
                </select>
              </div>
              @if (error()) {
                <p class="text-sm text-rose-600">{{ error() }}</p>
              }
              <button
                type="button"
                (click)="connect()"
                [disabled]="!canConnect() || busy()"
                class="w-full rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 disabled:opacity-50"
              >
                {{ busy() ? '...جارٍ التحقق' : 'ربط الحساب' }}
              </button>
            </div>
          }
        </section>
      </main>
    </div>
  `,
})
export class SettingsComponent {
  private readonly api = inject(ApiService);
  private readonly auth = inject(AuthService);

  readonly bosta = computed(() => this.auth.seller()?.bosta);

  apiKey = '';
  env: BostaEnv = 'staging';

  readonly busy = signal(false);
  readonly error = signal<string | null>(null);

  canConnect(): boolean {
    return this.apiKey.trim().length >= 20;
  }

  envLabel(env: BostaEnv): string {
    return env === 'production' ? 'إنتاج' : 'تجريبية';
  }

  async connect(): Promise<void> {
    if (!this.canConnect()) return;
    this.busy.set(true);
    this.error.set(null);
    try {
      const seller = await firstValueFrom(
        this.api.connectBosta({ apiKey: this.apiKey.trim(), env: this.env }),
      );
      this.auth.setSeller(seller);
      this.apiKey = '';
    } catch (e: any) {
      this.error.set(
        e?.error?.message ?? 'تعذّر ربط الحساب — تأكد من المفتاح والبيئة',
      );
    } finally {
      this.busy.set(false);
    }
  }

  async disconnect(): Promise<void> {
    this.busy.set(true);
    try {
      const seller = await firstValueFrom(this.api.disconnectBosta());
      this.auth.setSeller(seller);
    } finally {
      this.busy.set(false);
    }
  }
}
