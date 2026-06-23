import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import type { ProductDto } from '@cod/shared';
import { ApiService } from '../../core/api';
import { egp } from '../../core/labels';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [FormsModule, RouterLink],
  template: `
    <div class="mx-auto max-w-md min-h-screen pb-10">
      <header
        class="sticky top-0 z-10 bg-brand-700 text-white px-4 py-3 flex items-center gap-3"
      >
        <a routerLink="/dashboard" class="text-brand-100 text-xl leading-none">›</a>
        <h1 class="font-bold text-lg">المنتجات</h1>
      </header>

      <main class="px-4 mt-4 space-y-5">
        <!-- Add product -->
        <section class="bg-white rounded-2xl border border-slate-100 p-4">
          <h2 class="text-sm font-semibold mb-3">إضافة منتج</h2>
          <div class="space-y-3">
            <input
              name="newName"
              [(ngModel)]="newName"
              class="w-full rounded-xl border border-slate-200 px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="اسم المنتج"
            />
            <div class="flex gap-2">
              <input
                name="newPrice"
                [(ngModel)]="newPrice"
                type="number"
                dir="ltr"
                inputmode="numeric"
                class="flex-1 min-w-0 rounded-xl border border-slate-200 px-3 py-2.5 text-start focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="السعر (ج.م)"
              />
              <input
                name="newSku"
                [(ngModel)]="newSku"
                dir="ltr"
                class="w-28 rounded-xl border border-slate-200 px-3 py-2.5 text-start focus:outline-none focus:ring-2 focus:ring-brand-500"
                placeholder="SKU"
              />
            </div>
            @if (addError()) {
              <p class="text-sm text-rose-600">{{ addError() }}</p>
            }
            <button
              type="button"
              (click)="add()"
              [disabled]="!canAdd() || adding()"
              class="w-full rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 disabled:opacity-50"
            >
              {{ adding() ? '...' : 'إضافة المنتج' }}
            </button>
          </div>
        </section>

        <!-- List -->
        <section>
          <h2 class="font-bold text-slate-700 mb-2 px-1">
            الكتالوج ({{ products().length }})
          </h2>

          @if (loading()) {
            <p class="text-center text-slate-400 py-6">...جارٍ التحميل</p>
          } @else {
            <div class="space-y-2.5">
              @for (p of products(); track p.id) {
                <article
                  class="rounded-2xl bg-white border border-slate-100 p-4"
                  [class.opacity-60]="!p.isActive"
                >
                  @if (editingId() === p.id) {
                    <div class="space-y-2">
                      <input
                        [name]="'editName' + p.id"
                        [(ngModel)]="editName"
                        class="w-full rounded-lg border border-slate-200 px-3 py-2"
                      />
                      <input
                        [name]="'editPrice' + p.id"
                        [(ngModel)]="editPrice"
                        type="number"
                        dir="ltr"
                        class="w-full rounded-lg border border-slate-200 px-3 py-2 text-start"
                      />
                      <div class="flex gap-2 pt-1">
                        <button
                          type="button"
                          (click)="saveEdit(p)"
                          class="flex-1 rounded-lg bg-brand-600 text-white py-2 text-sm font-semibold"
                        >
                          حفظ
                        </button>
                        <button
                          type="button"
                          (click)="cancelEdit()"
                          class="flex-1 rounded-lg bg-slate-100 py-2 text-sm"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  } @else {
                    <div class="flex items-center justify-between gap-3">
                      <div class="min-w-0">
                        <p class="font-semibold truncate">{{ p.name }}</p>
                        <p class="num text-xs text-slate-400 mt-0.5">
                          {{ money(p.price) }}
                          @if (p.sku) {
                            · {{ p.sku }}
                          }
                        </p>
                      </div>
                      <div class="flex items-center gap-2 shrink-0">
                        <button
                          type="button"
                          (click)="toggleActive(p)"
                          class="text-xs px-2.5 py-1 rounded-full"
                          [class]="
                            p.isActive
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-slate-200 text-slate-500'
                          "
                        >
                          {{ p.isActive ? 'مُفعّل' : 'موقوف' }}
                        </button>
                        <button
                          type="button"
                          (click)="startEdit(p)"
                          class="text-xs px-2.5 py-1 rounded-full bg-slate-100 text-slate-700"
                        >
                          تعديل
                        </button>
                      </div>
                    </div>
                  }
                </article>
              } @empty {
                <p class="text-center text-slate-400 py-6">
                  لا توجد منتجات بعد — أضِف أول منتج بالأعلى
                </p>
              }
            </div>
          }
        </section>
      </main>
    </div>
  `,
})
export class ProductsComponent {
  private readonly api = inject(ApiService);

  readonly money = egp;

  readonly products = signal<ProductDto[]>([]);
  readonly loading = signal(true);

  // Add form
  newName = '';
  newPrice: number | null = null;
  newSku = '';
  readonly adding = signal(false);
  readonly addError = signal<string | null>(null);

  // Inline edit
  readonly editingId = signal<string | null>(null);
  editName = '';
  editPrice: number | null = null;

  constructor() {
    this.load();
  }

  async load(): Promise<void> {
    this.loading.set(true);
    try {
      this.products.set(await firstValueFrom(this.api.getProducts(true)));
    } finally {
      this.loading.set(false);
    }
  }

  canAdd(): boolean {
    return (
      this.newName.trim().length > 1 &&
      this.newPrice !== null &&
      Number(this.newPrice) >= 0
    );
  }

  async add(): Promise<void> {
    if (!this.canAdd()) return;
    this.adding.set(true);
    this.addError.set(null);
    try {
      const created = await firstValueFrom(
        this.api.createProduct({
          name: this.newName.trim(),
          price: Number(this.newPrice),
          sku: this.newSku.trim() || undefined,
        }),
      );
      this.products.update((ps) => [created, ...ps]);
      this.newName = '';
      this.newPrice = null;
      this.newSku = '';
    } catch {
      this.addError.set('تعذّر إضافة المنتج');
    } finally {
      this.adding.set(false);
    }
  }

  startEdit(p: ProductDto): void {
    this.editingId.set(p.id);
    this.editName = p.name;
    this.editPrice = p.price;
  }

  cancelEdit(): void {
    this.editingId.set(null);
  }

  async saveEdit(p: ProductDto): Promise<void> {
    const updated = await firstValueFrom(
      this.api.updateProduct(p.id, {
        name: this.editName.trim(),
        price: Number(this.editPrice),
      }),
    );
    this.replace(updated);
    this.editingId.set(null);
  }

  async toggleActive(p: ProductDto): Promise<void> {
    const updated = await firstValueFrom(
      this.api.updateProduct(p.id, { isActive: !p.isActive }),
    );
    this.replace(updated);
  }

  private replace(updated: ProductDto): void {
    this.products.update((ps) =>
      ps.map((x) => (x.id === updated.id ? updated : x)),
    );
  }
}
