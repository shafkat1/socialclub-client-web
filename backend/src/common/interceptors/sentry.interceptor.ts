import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  Logger,
} from '@nestjs/common';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import * as Sentry from '@sentry/node';

@Injectable()
export class SentryInterceptor implements NestInterceptor {
  private logger = new Logger('SentryInterceptor');

  intercept(_context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      catchError((error) => {
        if (process.env.SENTRY_DSN) {
          Sentry.captureException(error);
        }
        this.logger.error('Error caught', error);
        return throwError(() => error);
      }),
    );
  }
}
