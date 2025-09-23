import { Test, TestingModule } from '@nestjs/testing';
import { CementerioService } from './cementerio.service';

describe('CementerioService', () => {
  let service: CementerioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CementerioService],
    }).compile();

    service = module.get<CementerioService>(CementerioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
