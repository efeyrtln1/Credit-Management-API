import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let message: string | object = 'Sunucu tarafında beklenmeyen bir hata oluştu.';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse() as any;

      errorCode = res.error || exception.name || 'BAD_REQUEST';
      message = res.message || exception.message;
    }

    response.status(status).json({
      error: errorCode,
      message: message,
      timestamp: new Date().toISOString(),
    });
  }
}