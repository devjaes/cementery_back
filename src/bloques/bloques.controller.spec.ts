import { Test, TestingModule } from '@nestjs/testing';
import { BloquesController } from './bloques.controller';
import { BloquesService } from './bloques.service';

describe('BloquesController', () => {
  let controller: BloquesController;
  let service: BloquesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BloquesController],
      providers: [
        {
          provide: BloquesService,
          useValue: {
            create: jest.fn(),
            findAll: jest.fn(),
            findByCementerio: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
            remove: jest.fn(),
            search: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<BloquesController>(BloquesController);
    service = module.get<BloquesService>(BloquesService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});