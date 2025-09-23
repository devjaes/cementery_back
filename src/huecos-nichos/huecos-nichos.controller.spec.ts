import { Test, TestingModule } from '@nestjs/testing';
import { HuecosNichosController } from './huecos-nichos.controller';
import { HuecosNichosService } from './huecos-nichos.service';

describe('HuecosNichosController', () => {
  let controller: HuecosNichosController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HuecosNichosController],
      providers: [HuecosNichosService],
    }).compile();

    controller = module.get<HuecosNichosController>(HuecosNichosController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
