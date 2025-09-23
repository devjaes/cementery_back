import { Test, TestingModule } from '@nestjs/testing';
import { InhumacionesController } from './inhumaciones.controller';

describe('InhumacionesController', () => {
  let controller: InhumacionesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [InhumacionesController],
    }).compile();

    controller = module.get<InhumacionesController>(InhumacionesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
