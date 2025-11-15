import { Test, TestingModule } from '@nestjs/testing';
import { ExhumacionController } from './exhumacion.controller';
import { ExhumacionService } from './exhumacion.service';

describe('ExumacionController', () => {
  let controller: ExhumacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ExhumacionController],
      providers: [ExhumacionService],
    }).compile();

    controller = module.get<ExhumacionController>(ExhumacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
