import { Test, TestingModule } from '@nestjs/testing';
import { BloquesService } from './bloques.service';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Bloque } from './entities/bloque.entity';
import { Cementerio } from 'src/cementerio/entities/cementerio.entity';
import { Repository } from 'typeorm';

describe('BloquesService', () => {
  let service: BloquesService;
  let bloqueRepository: Repository<Bloque>;
  let cementerioRepository: Repository<Cementerio>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        BloquesService,
        {
          provide: getRepositoryToken(Bloque),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            find: jest.fn(),
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: getRepositoryToken(Cementerio),
          useValue: {
            findOne: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<BloquesService>(BloquesService);
    bloqueRepository = module.get<Repository<Bloque>>(getRepositoryToken(Bloque));
    cementerioRepository = module.get<Repository<Cementerio>>(getRepositoryToken(Cementerio));
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});