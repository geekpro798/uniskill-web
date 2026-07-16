/**
 * src/lib/platform-config.ts
 * 平台配置统一读取封装
 *
 * 优先级：DB 配置 > 环境变量 > 代码硬编码默认值
 * 未来按品类分层阈值时，只需扩展本文件，调用方无需改动。
 */

import { supabase } from '@/lib/supabase';

export interface PublishThresholds {
  minCalls: number;
  minSuccessRate: number;
}

const DEFAULTS: PublishThresholds = {
  minCalls: parseInt(process.env.PUBLISH_MIN_CALLS ?? '10'),
  minSuccessRate: parseFloat(process.env.PUBLISH_MIN_SUCCESS_RATE ?? '0.8'),
};

/**
 * 获取社区发布门槛配置
 * @param category 技能品类（可选），传入时优先查品类专属配置
 */
export async function getPublishThresholds(
  category?: string
): Promise<PublishThresholds> {
  try {
    // 构造查询 scope 列表：优先品类，fallback 到 global
    const scopes = category ? [category, 'global'] : ['global'];

    const { data, error } = await supabase
      .from('platform_config')
      .select('key, value, scope')
      .in('scope', scopes)
      .in('key', ['publish.min_calls', 'publish.min_success_rate']);

    if (error || !data || data.length === 0) {
      return DEFAULTS;
    }

    // 按 scope 优先级合并（category 值覆盖 global 值）
    const resolved: Record<string, string> = {};
    // 先写 global
    for (const row of data.filter(r => r.scope === 'global')) {
      resolved[row.key] = row.value;
    }
    // 再写 category（覆盖）
    if (category) {
      for (const row of data.filter(r => r.scope === category)) {
        resolved[row.key] = row.value;
      }
    }

    return {
      minCalls: resolved['publish.min_calls']
        ? parseInt(resolved['publish.min_calls'])
        : DEFAULTS.minCalls,
      minSuccessRate: resolved['publish.min_success_rate']
        ? parseFloat(resolved['publish.min_success_rate'])
        : DEFAULTS.minSuccessRate,
    };
  } catch {
    // DB 不可用时 fallback 到环境变量，不阻断业务流程
    return DEFAULTS;
  }
}
