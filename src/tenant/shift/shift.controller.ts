import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ShiftService } from './shift.service';
import { CreateShiftDto } from './dto/create-shift.dto';
import { UpdateShiftDto } from './dto/update-shift.dto';
import { AssignShiftDto } from './dto/assign-shift.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles/roles.guard';
import { Roles } from '../../common/decorators/roles/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user/current-user.decorator';

@Controller('shift')
@UseGuards(JwtAuthGuard)
export class ShiftController {
  constructor(private readonly shiftService: ShiftService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.CREATED)
  async createShift(
    @Body() createShiftDto: CreateShiftDto,
    @CurrentUser() user: any,
  ) {
    return this.shiftService.createShift(createShiftDto, user.organizationId);
  }

  @Get()
  async getAllShifts(@CurrentUser() user: any) {
    return this.shiftService.getAllShifts(user.organizationId);
  }

  @Get(':id')
  async getShiftById(@Param('id') id: string, @CurrentUser() user: any) {
    return this.shiftService.getShiftById(id, user.organizationId);
  }

  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  async updateShift(
    @Param('id') id: string,
    @Body() updateShiftDto: UpdateShiftDto,
    @CurrentUser() user: any,
  ) {
    return this.shiftService.updateShift(
      id,
      updateShiftDto,
      user.organizationId,
    );
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async deleteShift(@Param('id') id: string, @CurrentUser() user: any) {
    return this.shiftService.deleteShift(id, user.organizationId);
  }

  @Post('assign')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async assignShiftToUser(
    @Body() assignShiftDto: AssignShiftDto,
    @CurrentUser() user: any,
  ) {
    return this.shiftService.assignShiftToUser(
      assignShiftDto,
      user.organizationId,
    );
  }

  @Delete('assign/:userId')
  @UseGuards(RolesGuard)
  @Roles('admin')
  @HttpCode(HttpStatus.OK)
  async removeShiftFromUser(
    @Param('userId') userId: string,
    @CurrentUser() user: any,
  ) {
    return this.shiftService.removeShiftFromUser(userId, user.organizationId);
  }
}
