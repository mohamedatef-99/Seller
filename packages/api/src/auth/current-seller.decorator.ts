import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export interface CurrentSellerData {
  id: string;
  email: string;
  businessName: string;
  phone: string | null;
}

// Usage: someHandler(@CurrentSeller() seller: CurrentSellerData)
export const CurrentSeller = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): CurrentSellerData => {
    const request = ctx.switchToHttp().getRequest();
    return request.user;
  },
);
