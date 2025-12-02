import { Controller, Get, Query } from '@nestjs/common';
import { ReportsService } from './reports.service';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('owners')
  getOwners() {
    return this.reportsService.getOwners();
  }

  @Get('deceased')
  getDeceased(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('nicheId') nicheId?: string,
    @Query('cause') cause?: string,
  ) {
    return this.reportsService.getDeceased({
      startDate,
      endDate,
      nicheId,
      cause,
    });
  }
}
