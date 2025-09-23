import { DataSource } from 'typeorm';
import { Cementerio } from '../../cementerio/entities/cementerio.entity';
import { Nicho } from '../../nicho/entities/nicho.entity';
import { HuecosNicho } from '../../huecos-nichos/entities/huecos-nicho.entity';
import { PropietarioNicho } from '../../propietarios-nichos/entities/propietarios-nicho.entity';
import { Persona } from '../../personas/entities/persona.entity';
import { Inhumacion } from '../../inhumaciones/entities/inhumacion.entity';

export class CementerioSeeder {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const cementerioRepo = this.dataSource.getRepository(Cementerio);
    const nichoRepo = this.dataSource.getRepository(Nicho);
    const huecoRepo = this.dataSource.getRepository(HuecosNicho);
    const propietarioRepo = this.dataSource.getRepository(PropietarioNicho);
    const personaRepo = this.dataSource.getRepository(Persona);
    const inhumacionRepo = this.dataSource.getRepository(Inhumacion);

    console.log('🌱 Iniciando seed de cementerios...');

    try {
      // 1. Crear Cementerios
      console.log('📍 Creando cementerios...');
      const cementeriosData = [
        {
          nombre: 'Cementerio Central de Ambato',
          direccion: 'Av. Bolivariana y Calle Real',
          telefono: '032-822456',
          responsable: 'María Elena Vargas',
          estado: 'activo',
          fecha_creacion: new Date('2020-01-15').toISOString(),
          fecha_modificacion: new Date().toISOString()
        },
        {
          nombre: 'Cementerio San José',
          direccion: 'Sector Ficoa, Calle Los Álamos',
          telefono: '032-845123',
          responsable: 'Carlos Alberto Mendez',
          estado: 'activo',
          fecha_creacion: new Date('2018-03-20').toISOString(),
          fecha_modificacion: new Date().toISOString()
        }
      ];
      const cementerios = await cementerioRepo.save(cementerioRepo.create(cementeriosData));
      console.log(`✅ ${cementerios.length} cementerios creados`);

      // 2. Crear Propietarios de Nichos
      console.log('👥 Creando propietarios...');
      const propietarios = await propietarioRepo.save([
        {
          fecha_adquisicion: new Date('2020-06-15'),
          fecha_creacion: new Date('2020-06-15'),
          tipo_documento: 'cedula',
          numero_documento: '1803456789',
          estado: 'activo',
          observaciones: 'Propietario desde fundación del cementerio'
        },
        {
          fecha_adquisicion: new Date('2021-02-10'),
          tipo_documento: 'cedula',
          fecha_creacion: new Date('2020-06-15'),
          numero_documento: '1804567890',
          estado: 'activo',
          observaciones: 'Adquisición por herencia familiar'
        },
        {
          fecha_adquisicion: new Date('2021-08-22'),
          tipo_documento: 'cedula',
          fecha_creacion: new Date('2020-06-15'),
          numero_documento: '1805678901',
          estado: 'activo',
          observaciones: 'Compra directa'
        },
        {
          fecha_adquisicion: new Date('2022-01-30'),
          tipo_documento: 'cedula',
          fecha_creacion: new Date('2020-06-15'),
          numero_documento: '1806789012',
          estado: 'activo',
          observaciones: 'Propietario corporativo'
        }
      ]);
      console.log(`✅ ${propietarios.length} propietarios creados`);

      // 3. Crear Nichos
      console.log('🏗️  Creando nichos...');
      const nichos: Partial<Nicho>[] = [];
      
      // Nichos para Cementerio Central de Ambato
      for (let sector = 1; sector <= 2; sector++) {
        for (let fila = 1; fila <= 3; fila++) {
          for (let numero = 1; numero <= 5; numero++) {
            const propietarioIndex = Math.floor(Math.random() * propietarios.length);
            nichos.push({
              sector: sector.toString(),
              fila: fila.toString(),
              numero: numero.toString(),
              tipo: numero <= 2 ? 'familiar' : numero <= 4 ? 'individual' : 'temporal',
              estado: Math.random() > 0.2 ? 'ocupado' : 'disponible',
              fecha_construccion: '2020-01-20',
              observaciones: `Nicho Sector ${sector}, Fila ${fila}, Número ${numero}`,
              fecha_creacion: new Date().toISOString(),
              fecha_actualizacion: new Date().toISOString(),
              id_cementerio: cementerios[0],
              propietarios_nicho: [propietarios[propietarioIndex]],
              num_huecos: numero
            });
          }
        }
      }

      // Nichos para Cementerio San José
      for (let sector = 1; sector <= 2; sector++) {
        for (let fila = 1; fila <= 2; fila++) {
          for (let numero = 1; numero <= 4; numero++) {
            const propietarioIndex = Math.floor(Math.random() * propietarios.length);
            nichos.push({
              sector: sector.toString(),
              fila: fila.toString(),
              numero: numero.toString(),
              tipo: numero <= 2 ? 'familiar' : 'individual',
              estado: Math.random() > 0.3 ? 'ocupado' : 'disponible',
              fecha_construccion: new Date('2018-04-01').toISOString(),
              observaciones: `Nicho Sector ${sector}, Fila ${fila}, Número ${numero}`,
              fecha_creacion: new Date().toISOString(),
              fecha_actualizacion: new Date().toDateString(),
              id_cementerio: cementerios[1],
              propietarios_nicho: [propietarios[propietarioIndex]],
              num_huecos: numero
            });
          }
        }
      }

      const nichosCreados = await nichoRepo.save(nichos);
      console.log(`✅ ${nichosCreados.length} nichos creados`);

      // 4. Crear Huecos para cada Nicho
      console.log('🕳️  Creando huecos...');
      const huecos: Partial<HuecosNicho>[] = [];
      
      nichosCreados.forEach(nicho => {
        const numHuecos = nicho.tipo === 'familiar' ? 4 : nicho.tipo === 'individual' ? 1 : 2;

        for (let i = 1; i <= numHuecos; i++) {
          huecos.push({
        id_nicho: nicho,
        num_hueco: i,
        estado: Math.random() > 0.4 ? 'ocupado' : 'disponible',
        fecha_creacion: new Date(),
        fecha_actualizacion: new Date(),
          });
        }
      });

      const huecosCreados = await huecoRepo.save(huecos);
      console.log(`✅ ${huecosCreados.length} huecos creados`);

      // 5. Crear Personas para las inhumaciones
      console.log('👤 Creando personas...');
      const personas = await personaRepo.save([
        {
          cedula: '1801234567',
          nombres: 'María Esperanza',
          apellidos: 'González Pérez',
          fecha_nacimiento: new Date('1945-03-12'),
          fecha_defuncion: new Date('2020-08-15'),
          lugar_defuncion: 'Hospital Provincial Ambato',
          causa_defuncion: 'Causas naturales - Edad avanzada',
          direccion: 'Barrio La Merced, Calle Sucre 123',
          telefono: '032-823456',
          correo: 'familia.gonzalez@email.com',
          tipo: 'fallecido',
          fecha_creacion: new Date('2020-08-15'),
          fecha_actualizacion: new Date()
        },
        {
          cedula: '1802345678',
          nombres: 'José Antonio',
          apellidos: 'Ramírez Silva',
          fecha_nacimiento: new Date('1938-11-28'),
          fecha_defuncion: new Date('2021-01-20'),
          lugar_defuncion: 'Domicilio particular',
          causa_defuncion: 'Complicaciones respiratorias',
          direccion: 'Av. Cevallos 456, Centro',
          telefono: '032-834567',
          correo: 'familia.ramirez@email.com',
          tipo: 'fallecido',
          fecha_creacion: new Date('2021-01-20'),
          fecha_actualizacion: new Date()
        },
        {
          cedula: '1803456789',
          nombres: 'Ana Lucía',
          apellidos: 'Morales Castro',
          fecha_nacimiento: new Date('1952-07-08'),
          fecha_defuncion: new Date('2021-09-12'),
          lugar_defuncion: 'Clínica San Francisco',
          causa_defuncion: 'Complicaciones cardíacas',
          direccion: 'Ciudadela España, Manzana 5',
          telefono: '032-845678',
          correo: 'familia.morales@email.com',
          tipo: 'fallecido',
          fecha_creacion: new Date('2021-09-12'),
          fecha_actualizacion: new Date()
        },
        {
          cedula: '1804567890',
          nombres: 'Carlos Eduardo',
          apellidos: 'Vásquez Torres',
          fecha_nacimiento: new Date('1960-02-14'),
          fecha_defuncion: new Date('2022-03-05'),
          lugar_defuncion: 'Hospital del IESS',
          causa_defuncion: 'Accidente cerebrovascular',
          direccion: 'Sector Ficoa, Calle Los Claveles',
          telefono: '032-856789',
          correo: 'familia.vasquez@email.com',
          tipo: 'fallecido',
          fecha_creacion: new Date('2022-03-05'),
          fecha_actualizacion: new Date()
        }
      ]);
      console.log(`✅ ${personas.length} personas creadas`);

      // 6. Crear Inhumaciones
      console.log('⚰️  Creando inhumaciones...');
      const inhumaciones: Partial<Inhumacion>[] = [];
      const huecosOcupados = huecosCreados.filter(h => h.estado === 'ocupado');
      
      personas.forEach((persona, index) => {
        if (index < huecosOcupados.length) {
          const hueco = huecosOcupados[index];
            inhumaciones.push({
            fecha_inhumacion: new Date(persona.fecha_defuncion.getTime() + 24 * 60 * 60 * 1000),
            hora_inhumacion: new Date(persona.fecha_defuncion.getTime() + 24 * 60 * 60 * 1000 + 10 * 60 * 60 * 1000).toISOString().split('T')[1]?.substring(0, 8) ?? '10:00:00',
            solicitante: `Familia ${persona.apellidos.split(' ')[0]}`,
            responsable_inhumacion: 'Funeraria San Pedro',
            observaciones: `Inhumación de ${persona.nombres} ${persona.apellidos}`,
            estado: 'completada',
            codigo_inhumacion: `INH-${new Date().getFullYear()}-${String(index + 1).padStart(4, '0')}`,
            fecha_creacion: new Date(persona.fecha_defuncion.getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            fecha_actualizacion: new Date().toISOString().split('T')[0],
            id_nicho: hueco.id_nicho,
            id_fallecido: persona
            });
        }
      });

      const inhumacionesCreadas = await inhumacionRepo.save(inhumaciones);
      console.log(`✅ ${inhumacionesCreadas.length} inhumaciones creadas`);

      console.log('\n🎉 Seed completado exitosamente!');
      console.log(`
📊 Resumen de datos creados:
   • ${cementerios.length} Cementerios
   • ${propietarios.length} Propietarios de nichos
   • ${nichosCreados.length} Nichos
   • ${huecosCreados.length} Huecos de nichos
   • ${personas.length} Personas
   • ${inhumacionesCreadas.length} Inhumaciones
      `);

    } catch (error) {
      console.error('❌ Error durante el seed:', error);
      throw error;
    }
  }
}

export async function runCementerioSeed(dataSource: DataSource) {
  const seeder = new CementerioSeeder(dataSource);
  await seeder.run();
}