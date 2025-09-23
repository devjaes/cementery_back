import { DataSource } from 'typeorm';
import { Cementerio } from '../../cementerio/entities/cementerio.entity';
import { Nicho } from '../../nicho/entities/nicho.entity';
import { HuecosNicho } from '../../huecos-nichos/entities/huecos-nicho.entity';
import { PropietarioNicho } from '../../propietarios-nichos/entities/propietarios-nicho.entity';
import { Persona } from '../../personas/entities/persona.entity';
import { Inhumacion } from '../../inhumaciones/entities/inhumacion.entity';
import { Exumacion } from '../../exumacion/entities/exumacion.entity';
import { User } from '../../user/entities/user.entity';
import { RequisitosInhumacion } from '../../requisitos-inhumacion/entities/requisitos-inhumacion.entity';
import { runCementerioSeed } from './cementerio-seed';

class SeedRunner {
  private dataSource: DataSource;

  constructor() {
    this.dataSource = new DataSource({
      type: process.env.DB_TYPE as any || 'postgres',
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT!) || 5470,
      username: process.env.DB_USER || 'postgres',
      password: process.env.DB_PASSWORD || 'coso123',
      database: process.env.DB_NAME || 'DB_Cementerio',
      entities: [
        User,
        Cementerio,
        Nicho,
        Exumacion,
        Inhumacion,
        Persona,
        PropietarioNicho,
        RequisitosInhumacion,
        HuecosNicho,
      ],
      synchronize: false,
      logging: true,
    });
  }

  async run() {
    try {
      console.log('🔌 Conectando a la base de datos...');
      await this.dataSource.initialize();
      console.log('✅ Conexión establecida');

      // Verificar si ya existen datos
      const cementerioRepo = this.dataSource.getRepository(Cementerio);
      const existingCementerios = await cementerioRepo.count();

      if (existingCementerios > 0) {
        console.log('⚠️  Ya existen cementerios en la base de datos');
        const proceed = process.argv.includes('--force');
        
        if (!proceed) {
          console.log('💡 Usa --force para ejecutar de todas formas');
          console.log('   Ejemplo: npm run seed --force');
          return;
        }
        
        console.log('🔄 Ejecutando seed con --force...');
      }

      console.log('🌱 Iniciando proceso de seeds...');
      
      await runCementerioSeed(this.dataSource);
      
      console.log('🎉 ¡Seeds ejecutados exitosamente!');
      
    } catch (error) {
      console.error('❌ Error ejecutando seeds:', error);
      throw error;
    } finally {
      if (this.dataSource.isInitialized) {
        await this.dataSource.destroy();
        console.log('🔌 Conexión cerrada');
      }
    }
  }
}

if (require.main === module) {
  const runner = new SeedRunner();
  runner.run()
    .then(() => {
      console.log('Proceso completado');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error :', error);
      process.exit(1);
    });
}

export { SeedRunner };