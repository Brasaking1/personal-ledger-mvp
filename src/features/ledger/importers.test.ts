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

  it('skips WeChat export preamble and neutral rows', () => {
    const csv = [
      '微信支付账单明细,,,,,,,,,,',
      '微信昵称：[琪],,,,,,,,,,',
      '----------------------微信支付账单明细列表--------------------,,,,,,,,,,',
      '交易时间,交易类型,交易对方,商品,收/支,金额(元),支付方式,当前状态,交易单号,商户单号,备注',
      '2026-05-23 20:57:04,商户消费,清真大西北美食,清真大西北美食,支出,2,零钱,支付成功,wx-expense-1,merchant-1,/',
      '2026-05-21 17:10:48,零钱提现,建设银行(0091),/,/,2647.36,建设银行储蓄卡(0091),提现已到账,wx-neutral-1,/,服务费¥2.59',
      '2026-05-19 16:54:19,转账,yang,转账备注:微信转账,收入,3000,/,已存入零钱,wx-income-1,/,/'
    ].join('\n');

    const rows = parseBillText('wechat', csv);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ type: 'expense', amount: 2, externalKey: 'wx-expense-1' });
    expect(rows[1]).toMatchObject({ type: 'income', amount: 3000, externalKey: 'wx-income-1' });
  });

  it('skips Alipay export preamble and uses transaction order id', () => {
    const csv = [
      '------------------------------------------------------------------------------------',
      '导出信息：',
      '共209笔记录',
      '------------------------交易明细列表------------------------',
      '交易时间,交易分类,交易对方,对方账号,商品说明,收/支,金额,收/付款方式,交易状态,交易订单号,商家订单号,备注,',
      '2026-05-24 16:58:34,日用百货,无人零售,gou***@example.com,智能柜购物,支出,4.28,花呗,交易成功,ali-expense-1\\t,merchant-1\\t,,',
      '2026-05-24 02:28:32,信用借还,天津迎客松科技有限公司,/,借款解冻,不计收支,2000.00,,解冻成功,ali-neutral-1\\t,merchant-2\\t,,',
      '2026-05-23 21:00:18,餐饮美食,成都零食有鸣商业管理有限公司,yin***@example.com,门店消费,支出,1.71,花呗,交易成功,ali-expense-2\\t,merchant-3\\t,,'
    ].join('\n');

    const rows = parseBillText('alipay', csv);

    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      type: 'expense',
      amount: 4.28,
      note: '无人零售 智能柜购物',
      externalKey: 'ali-expense-1'
    });
    expect(rows[1]).toMatchObject({ categoryId: 'expense-food', externalKey: 'ali-expense-2' });
  });
});
