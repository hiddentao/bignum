import { BigVal, isBigVal, toMinStr } from '../'

const { expect} = require('./utils')


describe('constructor', () => {
  it('number', () => {
    (new BigVal(1)).should.be.instanceOf(BigVal)
  })

  it('string', () => {
    (new BigVal('1')).should.be.instanceOf(BigVal)
  })

  it('hex', () => {
    (new BigVal('0x1')).should.be.instanceOf(BigVal)
  })

  it('BigVal', () => {
    (new BigVal(new BigVal(1000000000000000))).should.be.instanceOf(BigVal)
  })

  it('Decimal.js', () => {
    (new BigVal((new BigVal(1000000000000000))._n)).should.be.instanceOf(BigVal)
  })
})

describe('output formats', () => {
  it('toNumber()', () => {
    (new BigVal(123)).toNumber().should.equal(123);
    (new BigVal('123')).toNumber().should.equal(123);
    (new BigVal('0x123')).toNumber().should.equal(291);
    (new BigVal('0xFFaab1324')).toNumber().should.equal(68630024996);
    (new BigVal(new BigVal(100000000000000000000))).toNumber().should.equal(100000000000000000000);
    (new BigVal((new BigVal(100000000000000000000))._n)).toNumber().should.equal(100000000000000000000);
  })

  it('toString()', () => {
    (new BigVal(123)).toString().should.equal('123');
    (new BigVal('123')).toString().should.equal('123');
    (new BigVal('0x123')).toString().should.equal('291');
    (new BigVal('0xFFaab1324')).toString().should.equal('68630024996');
    (new BigVal(new BigVal(100000000000000000000))).toString().should.equal('100000000000000000000');
    (new BigVal((new BigVal(100000000000000000000))._n)).toString().should.equal('100000000000000000000');
  })

  it('toString(16)', () => {
    (new BigVal(123)).toString(16).should.equal('0x7b');
    (new BigVal('123')).toString(16).should.equal('0x7b');
    (new BigVal('0x123')).toString(16).should.equal('0x123');
    (new BigVal('0xFFaab1324')).toString(16).should.equal('0xffaab1324');
    (new BigVal(new BigVal(100000000000000000000))).toString(16).should.equal('0x56bc75e2d63100000');
    (new BigVal((new BigVal(100000000000000000000))._n)).toString(16).should.equal('0x56bc75e2d63100000');
  })

  it('toString(2)', () => {
    (new BigVal(123)).toString(2).should.equal('1111011');
    (new BigVal('123')).toString(2).should.equal('1111011');
    (new BigVal('0x123')).toString(2).should.equal('100100011');
    (new BigVal('0xFFaab1324')).toString(2).should.equal('111111111010101010110000000000000000');
    (new BigVal(new BigVal(100000000000000000000))).toString(2).should.equal('1010110101111000111100000000000000000000000000000000000000000000000');
    (new BigVal((new BigVal(100000000000000000000))._n)).toString(2).should.equal('1010110101111000111100000000000000000000000000000000000000000000000');
  })

  it('toFixed()', () => {
    (new BigVal('123.23344')).toFixed(2).should.equal('123.23');
    (new BigVal('123.23584')).toFixed(3).should.equal('123.236');
    (new BigVal('123.23584')).toFixed(0).should.equal('123');
  })
})



describe('scaling + decimals', () => {
  it('construction basics', () => {
    const a = new BigVal("123.4", "coins");
    a.toString().should.equal("123.4");
    a.scale.should.equal("coins");
    a.config.should.deep.equal({ decimals: 18 });
    a.decimalCount.should.equal(1);

    const b = new BigVal("123.4", "min");
    b.toString().should.equal("123.4");
    b.scale.should.equal("min");
    b.config.should.deep.equal({ decimals: 18 });
    b.decimalCount.should.equal(1);

    const c = new BigVal("123.4", "min");
    c.toString().should.equal("123.4");
    c.scale.should.equal("min");
    c.config.should.deep.equal({ decimals: 18 });
    c.decimalCount.should.equal(1);

    const d = new BigVal("123.4", "min", { decimals: 2 });
    d.toString().should.equal("123.4");
    d.scale.should.equal("min");
    d.config.should.deep.equal({ decimals: 2 });
    d.decimalCount.should.equal(1);

    const e = new BigVal("0.00000001", "coins", { decimals: 8 });
    e.toString().should.equal("1e-8");
    e.scale.should.equal("coins");
    e.config.should.deep.equal({ decimals: 8 });
    e.decimalCount.should.equal(8);
  })

  it('constructing from existing BigVal copies source scale', () => {
    const a = new BigVal(1, 'coins')
    const b = new BigVal(a)
    b.scale.should.equal(a.scale)
  })

  describe('static: from()', () => {
    it('construction basics', () => {
      const a = (BigVal.from('123.4', 'coins'));
      a.toString().should.equal('123.4');
      a.scale.should.equal('coins');
      a.config.should.deep.equal({ decimals: 18 });

      const b = (BigVal.from('123.4', 'min'))
      b.toString().should.equal('123.4');
      b.scale.should.equal('min');
      b.config.should.deep.equal({ decimals: 18 });

      const c = (BigVal.from('123.4', 'min'))
      c.toString().should.equal('123.4');
      c.scale.should.equal('min');
      c.config.should.deep.equal({ decimals: 18 });

      const d = (BigVal.from('123.4', 'min', { decimals: 2 }));
      d.toString().should.equal('123.4');
      d.scale.should.equal('min');
      d.config.should.deep.equal({ decimals: 2 });
    })

    it('constructing from existing BigVal copies source scale', () => {
      const a = new BigVal(1, 'coins')
      const b = BigVal.from(a)
      b.scale.should.equal(a.scale)
    })
  })

  describe('static: fromStr()', () => {
    it('construction basics', () => {
      const a = (BigVal.fromStr('123.4 coins'));
      a.toString().should.equal('123.4');
      a.scale.should.equal('coins');
      a.config.should.deep.equal({ decimals: 18 });

      const b = (BigVal.fromStr('123.4 min'))
      b.toString().should.equal('123.4');
      b.scale.should.equal('min');
      b.config.should.deep.equal({ decimals: 18 });

      const c = (BigVal.fromStr('123.4 min'))
      c.toString().should.equal('123.4');
      c.scale.should.equal('min');
      c.config.should.deep.equal({ decimals: 18 });

      const d = (BigVal.fromStr('123.4 min', { decimals: 2 }));
      d.toString().should.equal('123.4');
      d.scale.should.equal('min');
      d.config.should.deep.equal({ decimals: 2 });
    })
  })

  it('scale up/down', () => {
    const a = new BigVal('123.4', 'coins', { decimals: 2 });

    a.toCoinScale().should.not.equal(a) // immutable
    a.toCoinScale().toString().should.equal('123.4')
    a.toCoinScale().scale.should.equal('coins')

    a.toScale('coins').should.not.equal(a) // immutable
    a.toScale('coins').toString().should.equal('123.4')
    a.toScale('coins').scale.should.equal('coins')

    a.toMinScale().should.not.equal(a) // immutable
    a.toMinScale().toString().should.equal('12340')
    a.toMinScale().scale.should.equal('min')

    a.toScale('min').should.not.equal(a) // immutable
    a.toScale('min').toString().should.equal('12340')
    a.toScale('min').scale.should.equal('min')

    a.toMinScale().toCoinScale().toString().should.equal('123.4')
    a.toMinScale().toCoinScale().scale.should.equal('coins')
  })
})


describe('boolean logic', () => {
  it('number', () => {
    const a = new BigVal(100, 'coins')
    a.eq(100).should.be.true
    a.gte(100).should.be.true
    a.gt(100).should.be.false
    a.gt(99).should.be.true
    a.lte(100).should.be.true
    a.lt(100).should.be.false
    a.lt(101).should.be.true
  })

  it('string', () => {
    const a = new BigVal(100, 'coins')
    a.eq('100').should.be.true
    a.gte('100').should.be.true
    a.gt('100').should.be.false
    a.gt('99').should.be.true
    a.lte('100').should.be.true
    a.lt('100').should.be.false
    a.lt('101').should.be.true
  })

  it('hex', () => {
    const a = new BigVal(100, 'coins')
    a.eq('0x64').should.be.true
    a.gte('0x64').should.be.true
    a.gt('0x64').should.be.false
    a.gt('0x63').should.be.true
    a.lte('0x64').should.be.true
    a.lt('0x64').should.be.false
    a.lt('0x65').should.be.true
  })

  it('BigVal', () => {
    const a = new BigVal(100, 'coins')
    a.eq(new BigVal('0x64')).should.be.true
    a.gte(new BigVal('0x64')).should.be.true
    a.gt(new BigVal('0x64')).should.be.false
    a.gt(new BigVal('0x63')).should.be.true
    a.lte(new BigVal('0x64')).should.be.true
    a.lt(new BigVal('0x64')).should.be.false
    a.lt(new BigVal('0x65')).should.be.true
  })
})


describe('arithmetic', () => {
  it('number', () => {
    const a = new BigVal(98)
    const v = 20
    a.add(v).toString().should.equal('118')
    a.sub(v).toString().should.equal('78')
    a.mul(v).toString().should.equal('1960')
    a.div(v).toString(3).should.equal('4.9')
  })

  it('string', () => {
    const a = new BigVal(98)
    const v = '20'
    a.add(v).toString().should.equal('118')
    a.sub(v).toString().should.equal('78')
    a.mul(v).toString().should.equal('1960')
    a.div(v).toString(3).should.equal('4.9')
  })

  it('hex', () => {
    const a = new BigVal(98)
    const v = '0x14'
    a.add(v).toString().should.equal('118')
    a.sub(v).toString().should.equal('78')
    a.mul(v).toString().should.equal('1960')
    a.div(v).toString(3).should.equal('4.9')
  })

  it('BigVal', () => {
    const a = new BigVal(98)
    const v = new BigVal(20)
    a.add(v).toString().should.equal('118')
    a.sub(v).toString().should.equal('78')
    a.mul(v).toString().should.equal('1960')
    a.div(v).toString(3).should.equal('4.9')
  })
})


describe('isBigVal()', () => {
  it('works', () => {
    expect(isBigVal(0)).to.be.false
    expect(isBigVal('100')).to.be.false
    expect(isBigVal({
      toString: () => {}
    })).to.be.false
    expect(isBigVal(undefined)).to.be.false
    expect(isBigVal(null)).to.be.false
    expect(isBigVal(new BigVal(1))).to.be.true
  })
})


describe('toMinStr()', () => {
  it('works', () => {
    expect(toMinStr('0')).to.eq('0')
    expect(toMinStr('100')).to.eq('100')
    expect(toMinStr('100 min')).to.eq('100')
    expect(toMinStr('1 coins')).to.eq('1000000000000000000')
    expect(toMinStr('1 coins', { decimals: 2 })).to.eq('100')
  })
})