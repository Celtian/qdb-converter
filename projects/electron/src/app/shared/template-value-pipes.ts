import { Pipe, type PipeTransform } from '@angular/core';

@Pipe({ name: 'arrayIncludes' })
export class ArrayIncludesPipe implements PipeTransform {
  transform(values: readonly unknown[] | null | undefined, value: unknown): boolean {
    return values?.includes(value) ?? false;
  }
}

@Pipe({ name: 'arrayJoin' })
export class ArrayJoinPipe implements PipeTransform {
  transform(values: readonly unknown[] | null | undefined, separator = ', '): string {
    return values?.join(separator) ?? '';
  }
}

@Pipe({ name: 'setHas' })
export class SetHasPipe implements PipeTransform {
  transform(values: ReadonlySet<unknown> | null | undefined, value: unknown): boolean {
    return values?.has(value) ?? false;
  }
}
