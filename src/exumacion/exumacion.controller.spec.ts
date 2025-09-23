import { Test, TestingModule } from '@nestjs/testing';
import { ExumacionController } from './exumacion.controller';
import { ExumacionService } from './exumacion.service';

describe('ExumacionController', () => {
  let controller: ExumacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExumacionController],
      providers: [ExumacionService],
    }).compile();

    controller = module.get<ExumacionController>(ExumacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
