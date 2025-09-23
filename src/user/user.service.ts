import { Injectable, BadRequestException, ConflictException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { Like, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

@Injectable()
export class UserService {
  constructor(@InjectRepository(User) private readonly userRepository: Repository<User>) {
    console.log('UserService initialized');
  }

  /**
   * Valida si una cédula ecuatoriana es válida
   */
  private validarCedula(cedula: string): boolean {
    if (!/^\d{10}$/.test(cedula)) return false; // Debe tener 10 dígitos
    const provincia = parseInt(cedula.substring(0, 2), 10);
    if (provincia < 1 || provincia > 24) return false; // Provincia válida (01-24)

    const coeficientes = [2, 1, 2, 1, 2, 1, 2, 1, 2];
    let suma = 0;

    for (let i = 0; i < 9; i++) {
      let valor = parseInt(cedula[i]) * coeficientes[i];
      if (valor >= 10) valor -= 9;
      suma += valor;
    }

    const digitoVerificador = (10 - (suma % 10)) % 10;
    return digitoVerificador === parseInt(cedula[9]);
  }

  /**
   * Valida si un RUC ecuatoriano es válido
   */
  private validarRuc(ruc: string): boolean {
    if (!/^\d{13}$/.test(ruc)) return false; // Debe tener 13 dígitos
    if (!ruc.endsWith('001')) return false; // Debe terminar en 001
    return this.validarCedula(ruc.substring(0, 10)); // Los primeros 10 dígitos deben ser una cédula válida
  }

  /**
   * Valida el formato de un correo electrónico
   */
  private validarEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Crea un nuevo usuario en la base de datos
   */
  async create(createUserDto: CreateUserDto) {
    try {
      const { cedula, email } = createUserDto;

      // Validar que se ingrese cédula o RUC
      if (!cedula) {
        throw new BadRequestException('Debe ingresar una cédula o un RUC');
      }

      const esCedula = this.validarCedula(cedula);
      const esRuc = this.validarRuc(cedula);

      // Validar formato de cédula o RUC
      if (!esCedula && !esRuc) {
        throw new BadRequestException('El número ingresado no es una cédula ni un RUC válido');
      }
      // Verificar si el usuario ya existe
      if (
        await this.userRepository.findOne({
          where: { cedula: createUserDto.cedula },
        })
      ) {
        throw new ConflictException('El usuario ya existe');
      }

      // Validar correo electrónico
      if (!email || !this.validarEmail(email)) {
        throw new BadRequestException('Debe ingresar un correo electrónico válido');
      }

      // Crear y guardar el usuario
      const Usuario = this.userRepository.create(createUserDto);
      return await this.userRepository.save(Usuario);
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Error al crear el usuario: ' + (error.message || error));
    }
  }

  /**
   * Obtiene todos los usuarios (sin contraseñas)
   */
  findAll() {
    try {
      return this.userRepository.find().then(users =>
        users.map(({ password, ...rest }) => rest)
      );
    } catch (error) {
      throw new InternalServerErrorException('Error al obtener los usuarios: ' + (error.message || error));
    }
  }

  /**
   * Busca un usuario por su ID
   */
  async findOne(id: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id_user: id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      // Excluir la contraseña del resultado
      const { password, ...rest } = user;
      return rest;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al buscar el usuario: ' + (error.message || error));
    }
  }

  /**
   * Actualiza los datos de un usuario
   */
  async update(id: string, updateUserDto: UpdateUserDto) {
    try {
      const user = await this.userRepository.findOne({ where: { id_user: id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      this.userRepository.merge(user, updateUserDto);
      return await this.userRepository.save(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el usuario: ' + (error.message || error));
    }
  }

  /**
   * Elimina un usuario por su ID
   */
  async remove(id: string) {
    try {
      const user = await this.userRepository.findOne({ where: { id_user: id } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      return await this.userRepository.remove(user);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar el usuario: ' + (error.message || error));
    }
  }

  /**
   * Valida las credenciales de un usuario (login)
   */
  async validateUser(username: string, pass: string): Promise<User | any> {
    try {
      const user = await this.userRepository.findOne({ where: { cedula: username } });
      if (user && (await bcrypt.compare(pass, user.password))) {
        return user;
      }
      return null;
    } catch (error) {
      throw new InternalServerErrorException('Error en la validación de usuario: ' + (error.message || error));
    }
  }

  /**
   * Busca un usuario por su cédula
   */
  async findByCedula(cedula: string) {
    try {
      const user = await this.userRepository.findOne({ where: { cedula: cedula } });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      // Excluir la contraseña del resultado
      const { password, ...rest } = user;
      return rest;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al buscar el usuario: ' + (error.message || error));
    }
  }
}
