[![NPM module](https://badge.fury.io/js/bigval.svg)](https://badge.fury.io/js/bigval)
[![Join the community](https://img.shields.io/badge/Chat%20on-Telegram-brightgreen.svg?color=0088cc)](https://t.me/erdDEV)
[![Follow on Twitter](https://img.shields.io/twitter/url/http/shields.io.svg?style=social&label=Follow&maxAge=2592000)](https://twitter.com/erd_dev)

# bigval

Javascript library for representing arbitrarily large or small crypto values with decimals. 

`bigval` is useful for handling extremely large crypto numbers with precision, e.g. when performing arithmetic with balances.

It is inspired by [ethval](https://github.com/hiddentao/ethval).

Features:

* Built-on on the robust [decimal.js](https://mikemcl.github.io/decimal.js/) library.
* Immutable-by-default to maximize code safety.
* Flexible about input types.
* Easy conversion between number scales (see below).

## Installation

```
npm install --save bigval
```

## Usage

Initializing a value:

```js
const { BigVal } = require('bigval')

const v1 = new BigVal(1000000000000000000)
const v2 = new BigVal('1000000000000000000')
const v3 = new BigVal('0xde0b6b3a7640000')
const v4 = new BigVal('b1000000000000000000')
const v5 = new BigVal(new BigVal(1000000000000000000))
```

Scaling:

```js
const v6 = new BigVal(6, 'coins')
const sameAsV6 = new BigVal('6000000000000000000', 'min')
const sameAsV6Again = new BigVal('6000000000000000000')
```

Scaling is based on no. of decimals:

```js
const v = new BigVal(100, 'min', { decimals: 2 }) // same as new BigVal(1, 'coins', { decimals: 2 })

console.log( v.scale ) // 'min'

const v2 = v.toCoinScale()

console.log( v2.scale ) // 'coins'
console.log( v2.toString() ) // "1"

const v3 = v2.tominScale()

console.log( v3.scale ) // 'min'
console.log( v3.toString() ) // "100"
```

Simple arithmetic leaves original unchanged:

```js
const v = new BigVal(1000000000000000000)

const v2 = v.add(32) // v2 is a new instance of BigVal

console.log(v2 !== v) // true

console.log(v2.toString()) // "1000000000000000032"

console.log(v.toString()) // "1000000000000000000" - original unchanged
```

Output in different types:

```js
const v = new BigVal(255)

console.log( v.toString() ) // "255"
console.log( v.toString(10) ) // "255"
console.log( v.toString(16) ) // "FF"
console.log( v.toString(2) ) // "1111111"
console.log( v.toNumber() ) // 255
```

Decimals and rounding:

```js
const v = new BigVal(100)

const v2 = v.div(3)

console.log( v2.toString() ) // "33.333333333333333"
console.log( v2.toFixed(1) ) // "33.3"

const v3 = v2.round()

console.log( v3.toString() ) // "33"
```


Flexible input types:

```js
const v = new BigVal(255)

// these are all the same
v.add(32)
v.add('32')
v.add(new BigVal(32))
```

Logical operators:

```js
const v = new BigVal(255)

const isGreater = v.gte(254)

console.log( isGreater ) // true
```

## Number scales

At any given time a `BigVal` instance operates at a particular number _scale_. The scale is based on the the no. of `decimals` specified in the configuration (`BigValConfig`). By default the no. of `decimals` is 18.
 
The `min` scale (this is the default) is for numbers which do not have decimal places since they are already denominated in the smallest possible unit. The `coins` scale is for numbers which implicitly have decimal places.
 
For example, if a given `BigVal` has `decimals = 2` then the following two numbers are equivalent in value:
 
 * scale = `min`, value = `100`
 * scale = `coins`, value = `1`

If `decimals = 18` (this is the default) then the following two numbers are equivalent in value:

* scale = `min`, value = `1000000000000000000`
* scale = `coins`, value = `1`
 
The use of scales like this makes it easy to convert between chain-friendly and user-friendly values and perform arithmetic at the desired precision.


## Developer guide

To build both ESM and CommonJS output:

```shell
yarn build
```

To re-build the CommonJS output on chnage:

```shell
yarn dev
```

To test:

```shell
yarn test
```

To build the docs:

```shell
yarn build-docs
```

To publish a new release (this will create a tag, publish to NPM and publish the latest docs):

```shell
yarn release
```

## License

MIT