import { Test, TestingModule } from '@nestjs/testing';
import { ExumacionService } from './exumacion.service';

describe('ExumacionService', () => {
  let service: ExumacionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ExumacionService],
    }).compile();

    service = module.get<ExumacionService>(ExumacionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
