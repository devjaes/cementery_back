import { Test, TestingModule } from '@nestjs/testing';
import { NichoController } from './nicho.controller';
import { NichoService } from './nicho.service';

describe('NichoController', () => {
  let controller: NichoController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NichoController],
      providers: [NichoService],
    }).compile();

    controller = module.get<NichoController>(NichoController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
