import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('owners')
  getOwners(@Query('cedula') cedula?: string) {
    return this.reportsService.getOwners(cedula);
  }

  @Get('deceased')
  getDeceased(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('nicheId') nicheId?: string,
    @Query('cause') cause?: string,
    @Query('cedula') cedula?: string,
  ) {
    return this.reportsService.getDeceased({
      startDate,
      endDate,
      nicheId,
      cause,
      cedula,
    });
  }
}
