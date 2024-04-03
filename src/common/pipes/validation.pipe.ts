import {
  ArgumentMetadata,
  BadRequestException,
  Injectable,
  PipeTransform,
} from '@nestjs/common';
import { validate } from 'class-validator';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  async transform(value: any, { metatype }: ArgumentMetadata) {
    if (!metatype || !this.toValidate(metatype)) {
      return value;
    }
    const object = plainToInstance(metatype, value);
    const errors = await validate(object);

    if (errors.length > 0) {
      throw new BadRequestException(
        `Form Arguments invalid: ${this.formatErrors(errors)}`,
      );
    }
    return value;
  }

  private toValidate(metatype: any): boolean {
    const types: any[] = [String, Boolean, Number, Array, Object];
    return !types.includes(metatype);
  }

  private formatErrors(errors: any[]): string {
    return errors
      .map((err) => {
        // eslint-disable-next-line no-restricted-syntax, guard-for-in, no-unreachable-loop
        for (const property in err.constraints) {
          return err.constraints[property];
        }

        return null;
      })
      .join(', ');
  }
}
