import { Test, TestingModule } from '@nestjs/testing';
import { PropietariosNichosController } from './propietarios-nichos.controller';
import { PropietariosNichosService } from './propietarios-nichos.service';

describe('PropietariosNichosController', () => {
  let controller: PropietariosNichosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PropietariosNichosController],
      providers: [PropietariosNichosService],
    }).compile();

    controller = module.get<PropietariosNichosController>(PropietariosNichosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
