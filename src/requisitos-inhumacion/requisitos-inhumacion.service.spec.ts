import { Test, TestingModule } from '@nestjs/testing';
import { RequisitosInhumacionService } from './requisitos-inhumacion.service';

describe('RequisitosInhumacionService', () => {
  let service: RequisitosInhumacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RequisitosInhumacionService],
    }).compile();

    service = module.get<RequisitosInhumacionService>(RequisitosInhumacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
