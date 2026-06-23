import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { GOVERNORATES, type ProductDto } from '@cod/shared';
import { ApiService } from '../../core/api';
import { egp, governorateAr } from '../../core/labels';

interface Line {
  product: ProductDto;
  quantity: number;
}

@Component({
  selector: 'app-order-new',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-md min-h-screen pb-32">
      <header
        class="sticky top-0 z-10 bg-brand-700 text-white px-4 py-3 flex items-center gap-3"
      >
        <a routerLink="/dashboard" class="text-brand-100 text-xl leading-none">›</a>
        <h1 class="font-bold text-lg">طلب جديد</h1>
      </header>

      <main class="px-4 mt-4 space-y-4">
        <!-- Customer -->
        <section
          class="bg-white rounded-2xl border border-slate-100 p-4 space-y-3"
        >
          <div>
            <label class="block text-sm font-medium mb-1">اسم العميل</label>
            <input
              name="name"
              [(ngModel)]="customerName"
              class="w-full rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="مثال: منى أحمد"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">رقم الموبايل</label>
            <input
              name="phone"
              [(ngModel)]="customerPhone"
              dir="ltr"
              inputmode="tel"
              class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-start focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="01xxxxxxxxx"
            />
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">المحافظة</label>
            <select
              name="gov"
              [(ngModel)]="governorate"
              class="w-full rounded-xl border border-slate-200 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              @for (g of governorates; track g) {
                <option [value]="g">{{ govAr(g) }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">العنوان</label>
            <input
              name="address"
              [(ngModel)]="addressLine"
              class="w-full rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="الشارع، المبنى، الشقة"
            />
          </div>
        </section>

        <!-- Products -->
        <section class="bg-white rounded-2xl border border-slate-100 p-4">
          <h2 class="text-sm font-semibold mb-2">المنتجات</h2>

          <div class="flex gap-2">
            <select
              name="picker"
              [(ngModel)]="pickedId"
              class="flex-1 min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="" disabled>اختر منتجًا</option>
              @for (p of products(); track p.id) {
                <option [value]="p.id">{{ p.name }} — {{ money(p.price) }}</option>
              }
            </select>
            <button
              type="button"
              (click)="addLine()"
              [disabled]="!pickedId()"
              class="shrink-0 rounded-xl bg-brand-600 text-white px-4 font-semibold disabled:opacity-50"
            >
              إضافة
            </button>
          </div>

          @if (lines().length) {
            <ul class="mt-3 divide-y divide-slate-50">
              @for (l of lines(); track l.product.id) {
                <li class="py-2.5 flex items-center gap-3">
                  <div class="flex-1 min-w-0">
                    <p class="font-medium truncate">{{ l.product.name }}</p>
                    <p class="num text-xs text-slate-400">
                      {{ money(l.product.price) }} × {{ l.quantity }}
                    </p>
                  </div>
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="dec(l)"
                      class="h-7 w-7 rounded-lg bg-slate-100 text-lg leading-none"
                    >
                      −
                    </button>
                    <span class="num w-5 text-center">{{ l.quantity }}</span>
                    <button
                      type="button"
                      (click)="inc(l)"
                      class="h-7 w-7 rounded-lg bg-slate-100 text-lg leading-none"
                    >
                      +
                    </button>
                  </div>
                  <p class="num font-semibold w-20 text-end">
                    {{ money(l.product.price * l.quantity) }}
                  </p>
                </li>
              }
            </ul>
          } @else {
            <p class="mt-3 text-sm text-slate-400 text-center py-3">
              لم تُضِف منتجات بعد
            </p>
          }
        </section>

        <!-- Shipping -->
        <section class="bg-white rounded-2xl border border-slate-100 p-4">
          <label class="block text-sm font-medium mb-1">مصاريف الشحن</label>
          <input
            name="ship"
            type="number"
            [(ngModel)]="shippingFee"
            dir="ltr"
            inputmode="numeric"
            class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-start focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </section>

        @if (error()) {
          <p class="text-sm text-rose-600 text-center">{{ error() }}</p>
        }
      </main>

      <!-- Sticky total + submit -->
      <footer
        class="fixed bottom-0 inset-x-0 bg-white border-t border-slate-100 px-4 py-3"
      >
        <div class="mx-auto max-w-md flex items-center gap-3">
          <div class="flex-1">
            <p class="text-xs text-slate-500">إجمالي التحصيل (COD)</p>
            <p class="num text-2xl font-extrabold text-brand-700">
              {{ money(codTotal()) }}
            </p>
          </div>
          <button
            type="button"
            (click)="submit()"
            [disabled]="!canSubmit() || saving()"
            class="rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold px-6 py-3 disabled:opacity-50"
          >
            {{ saving() ? '...' : 'حفظ الطلب' }}
          </button>
        </div>
      </footer>
    </div>
  `,
})
export class OrderNewComponent {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);

  readonly governorates = GOVERNORATES;
  readonly money = egp;
  readonly govAr = governorateAr;

  readonly products = signal<ProductDto[]>([]);
  readonly lines = signal<Line[]>([]);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  pickedId = signal<string>('');

  customerName = '';
  customerPhone = '';
  governorate: string = GOVERNORATES[0];
  addressLine = '';
  shippingFee = 60;

  readonly itemsTotal = computed(() =>
    this.lines().reduce((s, l) => s + l.product.price * l.quantity, 0),
  );
  readonly codTotal = computed(
    () => this.itemsTotal() + Number(this.shippingFee || 0),
  );
  readonly canSubmit = computed(
    () =>
      this.lines().length > 0 &&
      this.customerName.trim().length > 1 &&
      this.customerPhone.trim().length > 5 &&
      this.addressLine.trim().length > 2,
  );

  constructor() {
    firstValueFrom(this.api.getProducts())
      .then((p) => this.products.set(p))
      .catch(() => this.error.set('تعذّر تحميل المنتجات'));
  }

  addLine(): void {
    const id = this.pickedId();
    if (!id) return;
    const product = this.products().find((p) => p.id === id);
    if (!product) return;

    const existing = this.lines().find((l) => l.product.id === id);
    if (existing) {
      this.inc(existing);
    } else {
      this.lines.update((ls) => [...ls, { product, quantity: 1 }]);
    }
    this.pickedId.set('');
  }

  inc(line: Line): void {
    this.lines.update((ls) =>
      ls.map((l) =>
        l.product.id === line.product.id
          ? { ...l, quantity: l.quantity + 1 }
          : l,
      ),
    );
  }

  dec(line: Line): void {
    this.lines.update((ls) =>
      ls
        .map((l) =>
          l.product.id === line.product.id
            ? { ...l, quantity: l.quantity - 1 }
            : l,
        )
        .filter((l) => l.quantity > 0),
    );
  }

  async submit(): Promise<void> {
    if (!this.canSubmit()) return;
    this.saving.set(true);
    this.error.set(null);
    try {
      await firstValueFrom(
        this.api.createOrder({
          customerName: this.customerName.trim(),
          customerPhone: this.customerPhone.trim(),
          addressLine: this.addressLine.trim(),
          governorate: this.governorate,
          shippingFee: Number(this.shippingFee || 0),
          items: this.lines().map((l) => ({
            productId: l.product.id,
            quantity: l.quantity,
          })),
        }),
      );
      this.router.navigate(['/dashboard']);
    } catch {
      this.error.set('تعذّر حفظ الطلب، حاول مرة أخرى');
    } finally {
      this.saving.set(false);
    }
  }
}
