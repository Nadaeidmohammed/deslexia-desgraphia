import {
  PipeTransform,
  Injectable,
  ArgumentMetadata,
  BadRequestException,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype, type }: ArgumentMetadata) {
    // Skip validation for custom decorators (like @GetUser, @CurrentUser)
    // or when there's no metatype
    if (!metatype || !this.toValidate(metatype) || type === 'custom') {
      return value;
    }

    const object = plainToInstance(metatype, value);
    const errors = await validate(object, {
      whitelist: true, // Strip properties that don't have decorators
      forbidNonWhitelisted: true, // Throw error if non-whitelisted properties are present
      transform: true, // Transform the object to the target type
      transformOptions: {
        enableImplicitConversion: true, // Enable implicit type conversion
      },
    });

    if (errors.length > 0) {
      const errorMessages = this.formatErrors(errors);
      console.error(
        'Validation errors:',
        JSON.stringify(errorMessages, null, 2),
      );
      throw new BadRequestException({
        message: 'Validation failed',
        errors: errorMessages,
        details: errorMessages
          .map((err) => `${err.property}: ${err.constraints.join(', ')}`)
          .join('; '),
      });
    }

    return object;
  }

  private toValidate(metatype: Function): boolean {
    const types: Function[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: any[]): any[] {
    return errors.map((error) => {
      const constraints = error.constraints;
      const property = error.property;
      const value = error.value;

      return {
        property,
        value,
        constraints: constraints ? Object.values(constraints) : [],
        children:
          error.children?.length > 0
            ? this.formatErrors(error.children)
            : undefined,
      };
    });
  }
}
