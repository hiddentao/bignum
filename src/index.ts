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
    } else if (a._isBigValber) {
      a = a.toString(10)
    }
  }

  return new PreciseDecimal(`${a}`)
}

/**
 * Convert input to `PreciseDecimal` instance based on the scale given in the reference value. 
 * 
 * @param input Input value.
 * @param reference Reference value.
 * @internal
 */
const toDecimalAtOriginalScale = (input: any, reference: BigVal): Decimal => (
  input._n ? input.toScale(reference.scale)._n : toDecimal(input)
)

/**
 * The scale of a `BigVal` instance.
 * 
 * For example, if the no. of `decimals` in the `BigValConfig` is set to `2` then a value of `1` at `NORMAL` scale = `1` and at `SMALLEST` scale = `100`.
 */
export enum BigValScale {
  /**
   * Smallest scale at which to represent values.
   */
  SMALLEST = 0,
  /**
   * Normal scale at which to represent values.
   */
  NORMAL = 1,
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
 * Represents an arbitrarily large or small number with decimals.
 * 
 * At any given time a `BigVal` instance operates at a particular number _scale_. The scale is based on the 
 * the no. of `decimals` specified in the configuration (`BigValConfig`). The `BigValScale.SMALLEST` scale 
 * is for numbers which do not have decimal places since they are already denominated in the smallest 
 * possible unit. The `BigValScale.NORMAL` scale is for numbers which implicitly have decimal places.
 * 
 * For example, if a given `BigVal` has `decimals = 2` then the following two numbers are equivalent in value:
 * 
 * - `BigValScale.SMALLEST`, value = `100`
 * - `BigValScale.NORMAL`, value = `1`
 * 
 * If `decimals = 18` (this is the default) then the following two numbers are equivalent in value:
 * 
 * - `BigValScale.SMALLEST`, value = `1000000000000000000`
 * - `BigValScale.NORMAL`, value = 1
 * 
 * The use of scales like this makes it easy to convert between chain-friendly and user-friendly values and perform arithmetic at the desired precision.
 * 
 * All the arithmetic methods are immutable, i.e. they return a new `BigVal` instance, leaving the original inputs unchanged.
 */
export class BigVal {
  /**
   * @internal
   */
  _n: Decimal
  /**
   * @internal
   */
  _scale: BigValScale
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
   * @param scale The scale of the input number.
   * @param config Custom configuration for this instance.
   */
  constructor(src: any, scale: BigValScale = BigValScale.SMALLEST, config: BigValConfig = { decimals: 18 }) {
    if (src instanceof BigVal) {
      this._n = toDecimal(src._n)
      this._scale = src.scale
      this._config = src.config
    } else {
      this._n = toDecimal(src)
      this._scale = scale
      this._config = config
    }

    ;['mul', 'sub', 'div', 'add'].forEach(method => {
      (this as any)[method] = (v: any) => (
        new BigVal((this._n as any)[method].call(this._n, toDecimalAtOriginalScale(v, this)), this._scale, this._config)
      )
    })

      ;['gt', 'gte', 'lt', 'lte', 'eq'].forEach(method => {
        (this as any)[method] = (v: any) => (
          (this._n as any)[method].call(this._n, toDecimalAtOriginalScale(v, this))
        )
      })
  }

  /**
   * Get current scale.
   */
  get scale(): BigValScale {
    return this._scale
  }

  /**
   * Get config.
   */
  get config(): BigValConfig {
    return this._config
  }

  /**
   * Multiply by the given power of 10.
   * @param v The power of 10.
   */
  scaleDown(v: any): BigVal {
    return this.mul(toDecimal(10).pow(toDecimal(v)))
  }

  /**
   * Divide by the given power of 10.
   * @param v The power of 10.
   */
  scaleUp(v: any): BigVal {
    return this.div(toDecimal(10).pow(toDecimal(v)))
  }

  /**
   * Round to the nearest whole number.
   */
  round(): BigVal {
    return new BigVal(this._n.toDecimalPlaces(0), this._scale, this._config)
  }

  /**
   * Convert to smallest scale.
   */
  toSmallestScale(): BigVal {
    if (this._scale === BigValScale.SMALLEST) {
      return this
    } else {
      const n = this.scaleDown(this._config.decimals)
      n._scale = BigValScale.SMALLEST
      return n
    }
  }

  /**
   * Convert to normal scale.
   */
  toNormalScale(): BigVal {
    if (this._scale === BigValScale.NORMAL) {
      return this
    } else {
      const n = this.scaleUp(this._config.decimals)
      n._scale = BigValScale.NORMAL
      return n
    }
  }

  /**
   * Convert to given scale.
   * 
   * @param scale Scale to convert to.
   */
  toScale(scale: BigValScale): BigVal {
    switch (scale) {
      case BigValScale.SMALLEST:
        return this.toSmallestScale()
      case BigValScale.NORMAL:
        return this.toNormalScale()
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