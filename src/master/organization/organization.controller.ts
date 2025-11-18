import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { OrganizationService } from './organization.service';
import { RegisterOrganizationDto } from './dto/register-organization.dto';

@Controller('organization')
export class OrganizationController {
  constructor(private readonly organizationService: OrganizationService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(@Body() dto: RegisterOrganizationDto) {
    return this.organizationService.registerOrganization(dto);
  }
}
