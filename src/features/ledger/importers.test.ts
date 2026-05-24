import { describe, expect, it } from 'vitest';
import { parseBillText } from './importers';

describe('parseBillText', () => {
  it('normalizes a WeChat expense row', () => {
    const csv = '交易时间,交易类型,交易对方,商品,收/支,金额(元),支付方式,交易单号\n2026-05-01 12:30:00,商户消费,便利店,饮料,支出,¥8.50,零钱,wx-1';

    const rows = parseBillText('wechat', csv);

    expect(rows[0]).toMatchObject({
      type: 'expense',
      amount: 8.5,
      note: '便利店 饮料',
      paymentChannel: 'wechat',
      externalKey: 'wx-1'
    });
  });

  it('normalizes an Alipay income row', () => {
    const csv = '交易创建时间,交易分类,交易对方,商品说明,收/支,金额,交易号\n2026-05-02 09:00:00,转账,朋友,还款,收入,100.00,ali-1';

    const rows = parseBillText('alipay', csv);

    expect(rows[0]).toMatchObject({
      type: 'income',
      amount: 100,
      note: '朋友 还款',
      paymentChannel: 'alipay',
      externalKey: 'ali-1'
    });
  });
});
