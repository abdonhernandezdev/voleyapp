import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { envConfig } from '../../config/env.config';

/**
 * Filtro global de excepciones.
 *
 * Responsabilidades:
 * - Intercepta TODAS las excepciones (controladas y no controladas).
 * - Loguea internamente con contexto suficiente para debuggear.
 * - En producción devuelve mensajes genéricos para no filtrar
 *   información interna al cliente.
 * - En desarrollo devuelve el mensaje real para facilitar el debug.
 */
@Catch()
export class GlobalHttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalHttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | string[] = 'Error interno del servidor';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (
        typeof exceptionResponse === 'object' &&
        exceptionResponse !== null &&
        'message' in exceptionResponse
      ) {
        message = (exceptionResponse as { message: string | string[] }).message;
      }
    } else {
      // Excepción no controlada: logueamos el stack completo internamente
      // pero nunca lo exponemos al cliente.
      this.logger.error(
        `Unhandled exception on ${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    }

    // En producción: mensajes genéricos para errores 5xx para no filtrar
    // detalles de infraestructura. Los 4xx los dejamos pasar (son errores
    // del cliente, no revelan internos del servidor).
    const clientMessage =
      envConfig.app.isProduction && status >= 500 ? 'Error interno del servidor' : message;

    this.logger.warn(
      `${request.method} ${request.url} → ${status}`,
    );

    response.status(status).json({
      statusCode: status,
      message: clientMessage,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
