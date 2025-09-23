import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { UserService } from './user.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { RolesGuard } from 'src/auth/roles.guard';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiBody, 
  ApiParam, 
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse
} from '@nestjs/swagger';

@ApiBearerAuth() // Indica que la API usa JWT
@ApiTags('users') // Agrupa los endpoints en Swagger UI
@ApiUnauthorizedResponse({ description: 'No autorizado' })
@ApiForbiddenResponse({ description: 'Acceso prohibido' })
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Obtener todos los usuarios', description: 'Requiere rol de administrador' })
  @ApiOkResponse({ description: 'Lista de usuarios obtenida correctamente', type: [CreateUserDto] })
  findAll() {
    return this.userService.findAll();
  }

  @Get(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Obtener un usuario por ID' })
  @ApiParam({ name: 'id', description: 'ID del usuario', type: String })
  @ApiOkResponse({ description: 'Usuario encontrado', type: CreateUserDto })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  findOne(@Param('id') id: string) {
    return this.userService.findOne(id);
  }

  @Post()
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Crear un nuevo usuario', description: 'Requiere rol de administrador' })
  @ApiBody({ type: CreateUserDto })
  @ApiCreatedResponse({ description: 'Usuario creado exitosamente', type: CreateUserDto })
  @ApiResponse({ status: 400, description: 'Datos inválidos' })
  async create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  @Patch(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Actualizar un usuario existente' })
  @ApiParam({ name: 'id', description: 'ID del usuario a actualizar', type: String })
  @ApiBody({ type: UpdateUserDto })
  @ApiOkResponse({ description: 'Usuario actualizado exitosamente', type: CreateUserDto })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  update(@Param('id') id: string, @Body() updateUserDto: UpdateUserDto) {
    return this.userService.update(id, updateUserDto);
  }

  @Delete(':id')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Eliminar un usuario', description: 'Requiere rol de administrador' })
  @ApiParam({ name: 'id', description: 'ID del usuario a eliminar', type: String })
  @ApiOkResponse({ description: 'Usuario eliminado exitosamente' })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  remove(@Param('id') id: string) {
    return this.userService.remove(id);
  }
  
  @Get('cedula/:cedula')
  // @UseGuards(JwtAuthGuard, RolesGuard)
  @ApiOperation({ summary: 'Buscar usuario por cédula' })
  @ApiParam({ name: 'cedula', description: 'Número de cédula del usuario', type: String })
  @ApiOkResponse({ description: 'Usuario encontrado', type: CreateUserDto })
  @ApiNotFoundResponse({ description: 'Usuario no encontrado' })
  findByCedula(@Param('cedula') cedula: string) {
    return this.userService.findByCedula(cedula);
  }
}