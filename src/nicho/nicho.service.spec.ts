import { Test, TestingModule } from '@nestjs/testing';
import { NichoService } from './nicho.service';

describe('NichoService', () => {
  let service: NichoService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NichoService],
    }).compile();

    service = module.get<NichoService>(NichoService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
