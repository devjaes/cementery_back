import { Test, TestingModule } from '@nestjs/testing';
import { InhumacionesService } from './inhumaciones.service';

describe('InhumacionesService', () => {
  let service: InhumacionesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [InhumacionesService],
    }).compile();

    service = module.get<InhumacionesService>(InhumacionesService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
