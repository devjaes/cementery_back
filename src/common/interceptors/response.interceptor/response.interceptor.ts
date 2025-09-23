import { CallHandler, ExecutionContext, Injectable, NestInterceptor, HttpException, HttpStatus } from "@nestjs/common";
import { Observable, catchError, map, throwError } from "rxjs";
import { ResponseDto } from "src/common/dto/response.dto/response.dto";

@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T>> {
    return next.handle().pipe(
      map((data) => new ResponseDto(true, 'Operación exitosa', data)),
      catchError((err) => {
        const message = err.message || 'Error inesperado';

        const status = err.status || HttpStatus.INTERNAL_SERVER_ERROR;

        return throwError(() => new HttpException(
          new ResponseDto(false, message, null),
          status
        ));
      })
    );
  }
}
