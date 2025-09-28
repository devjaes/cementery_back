import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Observable, catchError, map, throwError } from 'rxjs';
import { ResponseDto } from 'src/common/dto/response.dto/response.dto';

@Injectable()
export class ResponseInterceptor<T>
  implements NestInterceptor<T, ResponseDto<T>>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ResponseDto<T>> {
    return next.handle().pipe(
      map((data: T) => new ResponseDto<T>(true, 'Operación exitosa', data)),
      catchError((error: unknown) => {
        const message = this.getErrorMessage(error);
        const status = this.getErrorStatus(error);

        return throwError(
          () =>
            new HttpException(
              new ResponseDto<null>(false, message, null),
              status,
            ),
        );
      }),
    );
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }
    if (typeof error === 'string') {
      return error;
    }
    if (error && typeof error === 'object' && 'message' in error) {
      return String(error.message);
    }
    return 'Error inesperado';
  }

  private getErrorStatus(error: unknown): number {
    if (error instanceof HttpException) {
      return error.getStatus();
    }
    if (error && typeof error === 'object' && 'status' in error) {
      const status = (error as { status: unknown }).status;
      if (typeof status === 'number') {
        return status;
      }
    }
    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
