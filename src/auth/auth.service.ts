import { Injectable, UnauthorizedException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';

@Injectable()
export class AuthService {
    private activeSessions = new Map<string, string[]>(); 

    constructor(
        private userService: UserService,
        private jwtService: JwtService,
    ) {
        this.startTokenCleanup();
    }

    // Función para iniciar la limpieza automática
    private startTokenCleanup() {
        setInterval(() => {
            console.log('Limpiando tokens expirados...');
            // Recorremos el mapa y limpiamos los tokens expirados
            for (const [cedula_ruc, tokens] of this.activeSessions.entries()) {
                const validTokens = tokens.filter(token => {
                    try {
                        this.jwtService.verify(token); // Verificamos si el token está expirado
                        return true; // Si el token es válido, lo mantenemos
                    } catch (e) {
                        console.log('Token expirado:', token);
                        return false; // Si el token expiró, lo eliminamos
                    }
                });

                if (validTokens.length > 0) {
                    this.activeSessions.set(cedula_ruc, validTokens);
                } else {
                    this.activeSessions.delete(cedula_ruc); // Eliminar la entrada si no hay tokens válidos
                }
            }
        }, 3600000); // Cada 1 hora (3600000 ms)
    }

    async validateUser(username: string, pass: string): Promise<any> {
        try {
            const user = await this.userService.validateUser(username, pass);
            if (user) {
                const { password, ...result } = user;
                return result;
            }
            return null;
        } catch (error) {
            throw new InternalServerErrorException('Error al validar usuario');
        }
    }

    async login(user: any) {
        try {
            const payload = { user_id: user.id_user, cedula: user.cedula, nombre: user.nombre, apellido: user.apellido, rol: user.rol };
            const token = this.jwtService.sign(payload);
            // Guardar sesión en la lista de sesiones activas
            if (!this.activeSessions.has(user.cedula_ruc)) {
                this.activeSessions.set(user.cedula_ruc, []);
            }
            this.activeSessions.get(user.cedula_ruc)?.push(token);

            return { access_token: token };
        } catch (error) {
            throw new InternalServerErrorException('Error al iniciar sesión');
        }
    }
    
    async logout(cedula_ruc: string, token: string) {
        try {
            const tokens = this.activeSessions.get(cedula_ruc);
            if (tokens) {
                this.activeSessions.set(cedula_ruc, tokens.filter(t => t !== token));
            }
        } catch (error) {
            throw new InternalServerErrorException('Error al cerrar sesión');
        }
    }

    getActiveSessions() {
        return this.activeSessions;
    }
}
