import { Decimal } from 'decimal.js'

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
    } else if (a._isbigvalber) {
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
const toDecimalAtOriginalScale = (input: any, reference: bigval): Decimal => (
  input._n ? input.toScale(reference.scale)._n : toDecimal(input)
)

/**
 * The scale of a `bigval` instance.
 */
export enum bigvalScale {
  SMALLEST = 0,
  NORMAL = 1,
}


/**
 * `bigval` configuration.
 */
export interface bigvalConfig {
  /**
   * No. of decimals values will have. Default is 18.
   */
  decimals?: number
}



/**
 * Represents an arbitrarily large or small number with decimals.
 * 
 * At any given time a `bigval` instance operates at a particular number _scale_. The scale is based on the 
 * the no. of `decimals` specified in the configuration (`bigvalConfig`). The `bigvalScale.SMALLEST` scale 
 * is for numbers which are do not have decimal places since they are already denominated in the smallest 
 * possible unit. The `bigvalScale.NORMAL` scale is for numbers which implicitly have decimal places.
 * 
 * For example, if a given `bigval` has `decimals = 2` then the following two numbers are equivalent in value:
 * 
 * - bigvalScale.SMALLEST, value = 100
 * - bigvalScale.NORMAL, value = 1
 * 
 * If `decimals` is 18 (this is the default) then the following two numbers are equivalent in value:
 * 
 * - bigvalScale.SMALLEST, value = 1000000000000000000
 * - bigvalScale.NORMAL, value = 1
 * 
 * The use of scales like this makes it easy to perform arithmetic at the desired precision.
 * 
 * All the arithmetic methods are immutable, i.e. they return a new `bigval` instance, leaving the original inputs unchanged.
 */
export class bigval {
  _n: Decimal
  _scale: bigvalScale
  _config: bigvalConfig
  // these will be set in the constructor
  mul: any
  sub: any
  div: any
  add: any
  gt: any
  gte: any
  lt: any
  lte: any
  eq: any

  /**
   * @constructor
   * @param src Input number. If this is a `bigval` instance then `scale` and `config` parameters will be ignored.
   * @param scale The scale of the input number.
   * @param config Custom configuration for this instance.
   */
  constructor(src: any, scale: bigvalScale = bigvalScale.SMALLEST, config: bigvalConfig = { decimals: 18 }) {
    if (src instanceof bigval) {
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
        new bigval((this._n as any)[method].call(this._n, toDecimalAtOriginalScale(v, this)), this._scale, this._config)
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
  get scale(): bigvalScale {
    return this._scale
  }

  /**
   * Get config.
   */
  get config(): bigvalConfig {
    return this._config
  }

  /**
   * Multiply by 10 to the power given input value.
   * @param v The power of 10.
   */
  scaleDown(v: any): bigval {
    return this.mul(toDecimal(10).pow(toDecimal(v)))
  }

  /**
   * Divide by 10 to the power given input value.
   * @param v The power of 10.
   */
  scaleUp(v: any): bigval {
    return this.div(toDecimal(10).pow(toDecimal(v)))
  }

  /**
   * Round to the nearest whole number.
   */
  round(): bigval {
    return new bigval(this._n.toDecimalPlaces(0), this._scale, this._config)
  }

  /**
   * Convert to smallest scale.
   */
  toSmallestScale(): bigval {
    if (this._scale === bigvalScale.SMALLEST) {
      return this
    } else {
      const n = this.scaleDown(this._config.decimals)
      n._scale = bigvalScale.SMALLEST
      return n
    }
  }

  /**
   * Convert to normal scale.
   */
  toNormalScale(): bigval {
    if (this._scale === bigvalScale.NORMAL) {
      return this
    } else {
      const n = this.scaleUp(this._config.decimals)
      n._scale = bigvalScale.NORMAL
      return n
    }
  }

  /**
   * Convert to given scale.
   * 
   * @param scale Scale to convert to.
   */
  toScale(scale: bigvalScale): bigval {
    switch (scale) {
      case bigvalScale.SMALLEST:
        return this.toSmallestScale()
      case bigvalScale.NORMAL:
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