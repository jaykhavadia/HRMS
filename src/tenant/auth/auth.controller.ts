import {
  Controller,
  Post,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { SetupPasswordDto } from './dto/setup-password.dto';
import { TenantGuard } from '../../common/guards/tenant/tenant.guard';
import { Tenant } from '../../common/decorators/tenant/tenant.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @UseGuards(TenantGuard)
  @HttpCode(HttpStatus.OK)
  async login(@Body() loginDto: LoginDto, @Tenant() tenant: any) {
    return this.authService.login(loginDto, tenant.clientId, tenant.clientName);
  }

  @Post('setup-password')
  @UseGuards(TenantGuard)
  @HttpCode(HttpStatus.OK)
  async setupPassword(
    @Body() setupPasswordDto: SetupPasswordDto,
    @Tenant() tenant: any,
    @Req() request: any,
  ) {
    // Get decoded token from TenantGuard
    const rawToken = request.decodedToken || setupPasswordDto.token;
    
    return this.authService.setupPassword(
      setupPasswordDto,
      tenant.clientId,
      tenant.clientName,
      rawToken,
    );
  }
}
