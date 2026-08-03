import { NgOptimizedImage } from '@angular/common';
import { Component, booleanAttribute, computed, input } from '@angular/core';

import { type CountryCode, FLAG_DIMENSIONS, getFlagPath } from './country-flags.generated';

interface FlagImageSource {
  src: string;
  srcset: string;
  width: number;
  height: number;
}

@Component({
  selector: 'app-country-flag',
  imports: [NgOptimizedImage],
  templateUrl: './country-flag.html',
  styleUrl: './country-flag.css',
})
export class CountryFlag {
  readonly code = input.required<string>();
  readonly countryName = input<string>();
  readonly decorative = input(false, { transform: booleanAttribute });

  protected readonly alt = computed(() =>
    this.decorative() ? '' : (this.countryName() ?? this.code().toLocaleUpperCase('en')),
  );
  protected readonly image = computed<FlagImageSource>(() => {
    const code = this.code().toLocaleLowerCase('en') as CountryCode;
    return {
      src: getFlagPath(code, '20x15', 'png'),
      srcset: [
        `${getFlagPath(code, '20x15', 'png')} 1x`,
        `${getFlagPath(code, '40x30', 'png')} 2x`,
        `${getFlagPath(code, '60x45', 'png')} 3x`,
      ].join(', '),
      ...FLAG_DIMENSIONS['20x15'],
    };
  });
}
