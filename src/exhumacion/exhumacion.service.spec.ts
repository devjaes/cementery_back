import { Test, TestingModule } from '@nestjs/testing';
import { ExhumacionService } from './exhumacion.service';

describe('ExumacionService', () => {
  let service: ExhumacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExhumacionService],
    }).compile();

    service = module.get<ExhumacionService>(ExhumacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
