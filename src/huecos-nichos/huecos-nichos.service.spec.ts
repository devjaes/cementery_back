import { Test, TestingModule } from '@nestjs/testing';
import { HuecosNichosService } from './huecos-nichos.service';

describe('HuecosNichosService', () => {
  let service: HuecosNichosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [HuecosNichosService],
    }).compile();

    service = module.get<HuecosNichosService>(HuecosNichosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
