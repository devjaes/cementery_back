import { UserService } from './../user/user.service';
import { Body, Controller, Post, Request, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { Cementerio } from 'src/cementerio/entities/cementerio.entity';
import { JwtAuthGuard } from './jwt-auth.guard';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiOkResponse,
  ApiBadRequestResponse
} from '@nestjs/swagger';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @Post('register')
  // @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Registrar nuevo usuario' })
  @ApiBody({
    description: 'Datos de registro',
    schema: {
      type: 'object',
      properties: {
        cedula: { type: 'string', example: '1234567890' },
        email: { type: 'string', example: 'usuario@example.com' },
        nombre: { type: 'string', example: 'Juan' },
        apellido: { type: 'string', example: 'Pérez' },
        password: { type: 'string', example: 'Password123' },
        rol: { type: 'string', example: 'user' },
      }
    }
  })
  @ApiOkResponse({ description: 'Usuario registrado exitosamente' })
  @ApiBadRequestResponse({ description: 'Datos inválidos' })
  async register(@Body() body: {cedula: string, email:string, nombre:string, apellido:string, password: string, rol:string}) {
    return this.userService.create(body);
  }

  @Post('login')
  @ApiOperation({ summary: 'Iniciar sesión' })
  @ApiBody({
    description: 'Credenciales de acceso',
    schema: {
      type: 'object',
      properties: {
        cedula: { type: 'string', example: '1234567890' },
        password: { type: 'string', example: 'Password123' }
      }
    }
  })
  @ApiOkResponse({ 
    description: 'Inicio de sesión exitoso',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' }
      }
    }
  })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas' })
  async login(@Body() body: { cedula: string, password: string }) {
    const user = await this.userService.validateUser(body.cedula, body.password);
    if (!user) {
      throw new BadRequestException('Usuario o contraseña incorrectos');
    }
    return this.authService.login(user);
  }

  @Post('logout')
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Cerrar sesión' })
  @ApiOkResponse({ description: 'Sesión cerrada correctamente' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  async logout(@Request() req) {
    await this.authService.logout(req.user.cedula, req.headers.authorization.split(' ')[1]);
    return { message: 'Sesión cerrada correctamente' };
  }

  @Post('profile')
  // @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Obtener perfil de usuario' })
  @ApiOkResponse({ description: 'Perfil de usuario' })
  @ApiUnauthorizedResponse({ description: 'No autorizado' })
  getProfile(@Request() req) {
    return req.user;
  }
}