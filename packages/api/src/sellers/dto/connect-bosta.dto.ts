import { IsIn, IsString, MinLength } from 'class-validator';
import type { BostaEnv, ConnectBostaDto as IConnect } from '@cod/shared';

export class ConnectBostaDto implements IConnect {
  @IsString()
  @MinLength(20) // Bosta integration keys are long hex strings
  apiKey: string;

  @IsIn(['staging', 'production'])
  env: BostaEnv;
}
