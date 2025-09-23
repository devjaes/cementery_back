import { Test, TestingModule } from '@nestjs/testing';
import { CementerioController } from './cementerio.controller';
import { CementerioService } from './cementerio.service';

describe('CementerioController', () => {
  let controller: CementerioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CementerioController],
      providers: [CementerioService],
    }).compile();

    controller = module.get<CementerioController>(CementerioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
