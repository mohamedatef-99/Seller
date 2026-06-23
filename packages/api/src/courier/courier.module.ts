import { Module } from '@nestjs/common';
import { BostaAdapter } from './bosta.adapter';
import { BostaStubAdapter } from './bosta-stub.adapter';
import { CourierService } from './courier.service';

// CryptoService comes from the global CryptoModule.
@Module({
  providers: [BostaAdapter, BostaStubAdapter, CourierService],
  exports: [CourierService],
})
export class CourierModule {}
