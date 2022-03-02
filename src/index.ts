import { Decimal } from 'decimal.js'

/**
 * @internal
 */
const PreciseDecimal = Decimal.clone({ defaults: true, toExpPos: 33 })

/**
 * Convert input to `PreciseDecimal` instance.
 * @param a Input of any type.
 * @internal
 */
const toDecimal = (a: any): Decimal => {
  if (a) {
    if (a._hex) {
      a = a._hex
    } else if (a._isBigNumber) {
      a = a.toString(10)
    }
  }

  return new PreciseDecimal(`${a}`)
}



/**
 * Number scales.
 * @internal
 */
const SCALE: Record<string, string> = {
  coins: 'coins',
  min: 'min',
}

/**
 * Check that given scale is valid.
 * @internal
 */
const assertValidScale = (s: string) => {
  if (!SCALE[s]) {
    throw new Error(`Invalid scale: ${s}`)
  }
}


/**
 * `BigVal` configuration.
 */
export interface BigValConfig {
  /**
   * No. of decimals values will have. Default is 18.
   */
  decimals?: number
}

/**
 * Default config for `BigVal`.
 */
export const DefaultBigValConfig: BigValConfig = { decimals: 18 }


/**
 * Get whether given value is a `BigVal` instance.
 * @param v A value.
 */
export const isBigVal = (v: any): boolean => {
  return !!(v && v._n && v.scale && v.toString && v.toMinScale)
}


/**
 * Represents an arbitrarily large or small number with decimals.
 * 
 * All the arithmetic methods are immutable, i.e. they return a new `BigVal` instance, leaving the original inputs unchanged.
 *
 * At any given time a `BigVal` instance operates at a particular number _scale_. The scale is based on the the no. of `decimals` specified in the configuration (`BigValConfig`).
 * 
 * The `min` scale is for numbers which do not have decimal places since they are already denominated in the smallest possible unit. The `coins` scale is for numbers which implicitly have decimal places.
 * 
 * For example, if a given `BigVal` has `decimals = 2` then the following two numbers are equivalent in value:
 * 
 * * scale = `min`, value = `100`
 * * scale = `coins`, value = `1`
 * 
 * If `decimals = 18` (this is the default) then the following two numbers are equivalent in value:
 * 
 * * scale = `min`, value = `1000000000000000000`
 * * scale = `coins`, value = 1
 * 
 * The use of scales like this makes it easy to convert between chain-friendly and user-friendly values and perform arithmetic at the desired precision.
 */
export class BigVal {
  /**
   * @internal
   */
  _n: Decimal
  /**
   * @internal
   */
  _scale: string
  /**
   * @internal
   */
  _config: BigValConfig
  /**
   * Multiply with another number.
   */
  mul!: (v: any) => BigVal
  /**
   * Subtract another number from this one.
   */
  sub!: (v: any) => BigVal
  /**
   * Divide this by another number.
   */
  div!: (v: any) => BigVal
  /**
   * Add another number to this one.
   */
  add!: (v: any) => BigVal
  /**
   * Get whether this is greater than another number.
   */
  gt!: (v: any) => boolean
  /**
   * Get whether this is greater than or equal to another number.
   */
  gte!: (v: any) => boolean
  /**
   * Get whether this is less than another number.
   */
  lt!: (v: any) => boolean
  /**
   * Get whether this is less than or equal to than another number.
   */
  lte!: (v: any) => boolean
  /**
   * Get whether this is equal to another number.
   */
  eq!: (v: any) => boolean

  /**
   * @constructor
   * @param src Input number. If this is a `BigVal` instance then `scale` and `config` parameters will be ignored.
   * @param scale The scale of the input number. Default is `min`.
   * @param config Custom configuration for this instance.
   */
  constructor(src: any, scale: string = 'min', config: BigValConfig = DefaultBigValConfig) {
    if (isBigVal(src)) {
      this._n = toDecimal(src._n)
      this._scale = src.scale
      this._config = src.config
    } else {
      this._n = toDecimal(src)
      assertValidScale(scale)
      this._scale = scale
      this._config = config
    }

    ;['mul', 'sub', 'div', 'add'].forEach(method => {
      (this as any)[method] = (v: any) => (
        new BigVal((this._n as any)[method].call(this._n, toDecimal(v)), this._scale, this._config)
      )
    })

    ;['gt', 'gte', 'lt', 'lte', 'eq'].forEach(method => {
      (this as any)[method] = (v: any) => (
        (this._n as any)[method].call(this._n, toDecimal(v))
      )
    })
  }

  /**
   * Construct a `BigVal` instance.
   * 
   * @param src Input number. If this is a `BigVal` instance then `scale` and `config` parameters will be ignored.
   * @param scale The scale of the input number. Default is `min`.
   * @param config Custom configuration for this instance.
   * @returns `BigVal` instance.
   */
  static from(src: any, scale: string = 'min', config: BigValConfig = DefaultBigValConfig): BigVal {
    return new BigVal(src, scale, config)
  }

  /**
   * Construct a `BigVal` instance.
   * 
   * @param numScale String in form: `<number> <scale>`. If scale ommitted then `min` is assumed.
   * @param config Custom configuration for this instance.
   * @returns `BigVal` instance.
   */
  static fromStr(numScale: string, config: BigValConfig = DefaultBigValConfig): BigVal {
    const t = numScale.split(' ')
    return this.from(t[0], t[1], config)
  }

  /**
   * Get current scale.
   */
  get scale(): string {
    return this._scale
  }

  /**
   * Get config.
   */
  get config(): BigValConfig {
    return this._config
  }

  /**
   * Round to the nearest whole number.
   */
  round(): BigVal {
    return new BigVal(this._n.toDecimalPlaces(0), this._scale, this._config)
  }

  /**
   * Convert to 'min' scale.
   */
  toMinScale(): BigVal {
    if (this._scale === SCALE.min) {
      return new BigVal(this)
    } else {
      const n = this.mul(toDecimal(10).pow(toDecimal(this._config.decimals)))
      n._scale = SCALE.min
      return n
    }
  }

  /**
   * Convert to 'coins' scale.
   */
  toCoinScale(): BigVal {
    if (this._scale === SCALE.coins) {
      return new BigVal(this)
    } else {
      const n = this.div(toDecimal(10).pow(toDecimal(this._config.decimals)))
      n._scale = SCALE.coins
      return n
    }
  }

  /**
   * Convert to given scale.
   * 
   * @param scale Scale to convert to.
   */
  toScale(scale: string): BigVal {
    assertValidScale(scale)

    switch (scale) {
      case SCALE.min:
        return this.toMinScale()
      case SCALE.coins:
        return this.toCoinScale()
      default:
        throw new Error(`Unrecognized scale: ${scale}`)
    }
  }

  /**
   * Get string representation in given base.
   * 
   * @param base Base to represent in. Default is 10.
   */
  toString(base: number = 10) {
    switch (base) {
      case 2: {
        let str = this._n.toBinary()
        str = str.substr(str.indexOf('b') + 1)
        return str
      }
      case 16: {
        return this._n.toHexadecimal()
      }
      default:
        return this._n.toString()
    }
  }

  /**
   * Get base-10 string representation to given no. of decimal places.
   * @param numDecimals No. of decimal places to show.
   */
  toFixed(numDecimals: number) {
    return this._n.toFixed(numDecimals)
  }

  /**
   * Get base-10 number representation.
   */
  toNumber() {
    return this._n.toNumber()
  }
}


/**
 * Get string representation of a `BigVal` in min scale.
 * 
 * @param v Input string 
 * @param config 
 * @returns 
 */
export const minStr = (v: string, config: BigValConfig = DefaultBigValConfig): string => {
  const t = v.trim().split(' ')
  
  if (t.length === 1) {
    t.push('min')
  }

  return new BigVal(t[0], t[1], config).toMinScale().toString()
}