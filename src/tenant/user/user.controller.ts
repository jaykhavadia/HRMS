import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Param,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles/roles.guard';
import { Roles } from '../../common/decorators/roles/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant/tenant.guard';
import { Tenant } from '../../common/decorators/tenant/tenant.decorator';
import { CurrentUser } from '../../common/decorators/current-user/current-user.decorator';

@Controller('user')
@UseGuards(JwtAuthGuard, TenantGuard)
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  async createUser(
    @Body() createUserDto: CreateUserDto,
    @Tenant() tenant: any,
  ) {
    return this.userService.createUser(
      createUserDto,
      tenant.clientId,
      tenant.clientName,
      tenant.companyDomain,
    );
  }

  @Post('bulk-upload')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @UseInterceptors(FileInterceptor('file'))
  async bulkUploadUsers(
    @UploadedFile() file: Express.Multer.File,
    @Tenant() tenant: any,
  ) {
    return this.userService.bulkUploadUsers(
      file,
      tenant.clientId,
      tenant.clientName,
      tenant.companyDomain,
    );
  }

  @Get()
  async getAllUsers(@Tenant() tenant: any, @CurrentUser() user: any) {
    // Admin can see all users, employee can only see their own
    if (user.role === 'admin') {
      return this.userService.getAllUsers(tenant.clientId, tenant.clientName);
    } else {
      return [
        await this.userService.getUserById(
          user.id,
          tenant.clientId,
          tenant.clientName,
        ),
      ];
    }
  }

  @Get(':id')
  async getUserById(
    @Param('id') id: string,
    @Tenant() tenant: any,
    @CurrentUser() user: any,
  ) {
    // Employees can only view their own profile
    if (user.role === 'employee' && user.id !== id) {
      throw new Error('Unauthorized to view this user');
    }

    return this.userService.getUserById(id, tenant.clientId, tenant.clientName);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateUser(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Tenant() tenant: any,
  ) {
    return this.userService.updateUser(
      id,
      updateUserDto,
      tenant.clientId,
      tenant.clientName,
      tenant.companyDomain,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteUser(@Param('id') id: string, @Tenant() tenant: any) {
    return this.userService.deleteUser(id, tenant.clientId, tenant.clientName);
  }
}
