import { ApiProperty } from '@nestjs/swagger';

/**
 * Use 생성 response 구조
 */
export class CreateUserResponseDto {
  @ApiProperty({ description: '생성된 User id' })
  userId: number;
}
