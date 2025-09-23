import { Test, TestingModule } from '@nestjs/testing';
import { RequisitosInhumacionController } from './requisitos-inhumacion.controller';
import { RequisitosInhumacionService } from './requisitos-inhumacion.service';

describe('RequisitosInhumacionController', () => {
  let controller: RequisitosInhumacionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RequisitosInhumacionController],
      providers: [RequisitosInhumacionService],
    }).compile();

    controller = module.get<RequisitosInhumacionController>(RequisitosInhumacionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
