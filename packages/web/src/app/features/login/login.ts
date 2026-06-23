import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center p-6">
      <div class="w-full max-w-sm">
        <div class="text-center mb-8">
          <div
            class="mx-auto mb-3 h-14 w-14 rounded-2xl bg-brand-600 text-white grid place-items-center text-2xl font-bold"
          >
            م
          </div>
          <h1 class="text-2xl font-bold">محصّل</h1>
          <p class="text-slate-500 mt-1 text-sm">
            تابِع فلوس الدفع عند الاستلام في مكان واحد
          </p>
        </div>

        <form
          (ngSubmit)="submit()"
          class="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4"
        >
          <div>
            <label class="block text-sm font-medium mb-1">البريد الإلكتروني</label>
            <input
              type="email"
              name="email"
              [(ngModel)]="email"
              required
              dir="ltr"
              class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-start focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="demo@cod.eg"
            />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">كلمة المرور</label>
            <input
              type="password"
              name="password"
              [(ngModel)]="password"
              required
              dir="ltr"
              class="w-full rounded-xl border border-slate-200 px-3 py-2.5 text-start focus:outline-none focus:ring-2 focus:ring-brand-500"
              placeholder="••••••••"
            />
          </div>

          @if (error()) {
            <p class="text-sm text-rose-600">{{ error() }}</p>
          }

          <button
            type="submit"
            [disabled]="loading()"
            class="w-full rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-semibold py-2.5 transition disabled:opacity-60"
          >
            {{ loading() ? '...جارٍ الدخول' : 'تسجيل الدخول' }}
          </button>

          <p class="text-xs text-center text-slate-400">
            حساب تجريبي: demo&#64;cod.eg / password123
          </p>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);

  email = 'demo@cod.eg';
  password = 'password123';

  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  async submit(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);
    try {
      await this.auth.login({ email: this.email, password: this.password });
      this.router.navigate(['/dashboard']);
    } catch {
      this.error.set('بيانات الدخول غير صحيحة');
    } finally {
      this.loading.set(false);
    }
  }
}
