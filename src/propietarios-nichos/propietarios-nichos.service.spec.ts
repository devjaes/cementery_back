import { Test, TestingModule } from '@nestjs/testing';
import { PropietariosNichosService } from './propietarios-nichos.service';

describe('PropietariosNichosService', () => {
  let service: PropietariosNichosService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PropietariosNichosService],
    }).compile();

    service = module.get<PropietariosNichosService>(PropietariosNichosService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
