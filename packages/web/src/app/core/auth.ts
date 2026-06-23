import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import type { AuthResponse, LoginDto, SellerDto } from '@cod/shared';
import { environment } from '../../environments/environment';

const TOKEN_KEY = 'cod_token';
const SELLER_KEY = 'cod_seller';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  private readonly _token = signal<string | null>(
    localStorage.getItem(TOKEN_KEY),
  );
  private readonly _seller = signal<SellerDto | null>(readSeller());

  readonly token = this._token.asReadonly();
  readonly seller = this._seller.asReadonly();
  readonly isLoggedIn = computed(() => this._token() !== null);

  async login(dto: LoginDto): Promise<void> {
    const res = await firstValueFrom(
      this.http.post<AuthResponse>(`${environment.apiUrl}/auth/login`, dto),
    );
    this.setSession(res);
  }

  logout(): void {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(SELLER_KEY);
    this._token.set(null);
    this._seller.set(null);
  }

  // Refresh the cached seller (e.g. after connecting/disconnecting Bosta).
  setSeller(seller: SellerDto): void {
    localStorage.setItem(SELLER_KEY, JSON.stringify(seller));
    this._seller.set(seller);
  }

  private setSession(res: AuthResponse): void {
    localStorage.setItem(TOKEN_KEY, res.accessToken);
    localStorage.setItem(SELLER_KEY, JSON.stringify(res.seller));
    this._token.set(res.accessToken);
    this._seller.set(res.seller);
  }
}

function readSeller(): SellerDto | null {
  const raw = localStorage.getItem(SELLER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SellerDto;
  } catch {
    return null;
  }
}
