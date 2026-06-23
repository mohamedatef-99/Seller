import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import type {
  ConnectBostaDto,
  CreateOrderDto,
  CreateProductDto,
  DashboardResponse,
  OrderDto,
  ProductDto,
  SellerDto,
  SyncResult,
  UpdateProductDto,
} from '@cod/shared';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);

  getDashboard(): Observable<DashboardResponse> {
    return this.http.get<DashboardResponse>(`${environment.apiUrl}/dashboard`);
  }

  // Order form: active products only. Catalog: pass includeInactive=true.
  getProducts(includeInactive = false): Observable<ProductDto[]> {
    const suffix = includeInactive ? '?includeInactive=true' : '';
    return this.http.get<ProductDto[]>(
      `${environment.apiUrl}/products${suffix}`,
    );
  }

  createProduct(dto: CreateProductDto): Observable<ProductDto> {
    return this.http.post<ProductDto>(`${environment.apiUrl}/products`, dto);
  }

  updateProduct(id: string, dto: UpdateProductDto): Observable<ProductDto> {
    return this.http.patch<ProductDto>(
      `${environment.apiUrl}/products/${id}`,
      dto,
    );
  }

  createOrder(dto: CreateOrderDto): Observable<OrderDto> {
    return this.http.post<OrderDto>(`${environment.apiUrl}/orders`, dto);
  }

  pushToCourier(orderId: string): Observable<OrderDto> {
    return this.http.post<OrderDto>(
      `${environment.apiUrl}/orders/${orderId}/push`,
      {},
    );
  }

  syncOrders(): Observable<SyncResult> {
    return this.http.post<SyncResult>(`${environment.apiUrl}/orders/sync`, {});
  }

  connectBosta(dto: ConnectBostaDto): Observable<SellerDto> {
    return this.http.post<SellerDto>(
      `${environment.apiUrl}/sellers/me/bosta`,
      dto,
    );
  }

  disconnectBosta(): Observable<SellerDto> {
    return this.http.delete<SellerDto>(`${environment.apiUrl}/sellers/me/bosta`);
  }
}
