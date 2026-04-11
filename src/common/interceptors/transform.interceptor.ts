import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Response } from 'express';

export interface ApiResponse<T> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: any;
  timestamp: string;
  path: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, ApiResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<ApiResponse<T>> {
    const request = context.switchToHttp().getRequest();
    const response = context.switchToHttp().getResponse<Response>();

    return next.handle().pipe(
      map((data: any) => {
        const isPagination = data && data.data && data.meta;
        const baseResponse = {
          success: true,
          statusCode: response.statusCode,
          message: this.getSuccessMessage(request.method, response.statusCode),
          timestamp: new Date().toISOString(),
          path: request.url,
        };

        if (isPagination) {
          return {
            ...baseResponse,
            data: data.data,
            meta: data.meta,
          };
        }

        return {
          ...baseResponse,
          data: data,
        };
      }),
    );
  }

  private getSuccessMessage(method: string, statusCode: number): string {
    switch (method) {
      case 'POST':
        return statusCode === 201
          ? 'Resource created successfully'
          : 'Operation completed successfully';
      case 'PUT':
      case 'PATCH':
        return 'Resource updated successfully';
      case 'DELETE':
        return 'Resource deleted successfully';
      case 'GET':
      default:
        return 'Operation completed successfully';
    }
  }
}