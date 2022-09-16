import { Controller, Get, Post, Param, HttpCode } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserResponseDto } from './dto/create-user.dto';
import {
  ApiCreatedResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FindUserResponseDto } from './dto/find-user.dto';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @ApiOperation({
    summary: '유저를 생성 API',
    description: '유저를 생성합니다.',
  })
  @ApiCreatedResponse({
    description: '유저를 생성합니다.',
    type: CreateUserResponseDto,
  })
  @HttpCode(201)
  @Post()
  create(): Promise<CreateUserResponseDto> {
    return this.userService.create();
  }

  @ApiOperation({
    summary: '유저 조회 API',
    description: '유저를 조회합니다.',
  })
  @ApiOkResponse({
    description: '유저를 조회합니다.',
    type: FindUserResponseDto,
  })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.userService.findOne(+id);
  }
}
