import { GAME_TITLE, HASHTAGS, OFFICIAL_SITE_URL, SHARE_LINES } from '../constants';
import type { ResultData } from '../types';

const shareLeadByType: Record<ResultData['resultType'], string[]> = {
  win: ['休み時間30秒、俺は机の上で天下を取った。', '消しゴムを弾いただけなのに、教室が沸いた。'],
  lose: ['自分の消しゴムだけ場外に飛びました。', '机の広さを信じすぎた結果です。'],
  selfDestruct: ['勢いは満点、結果は場外。', '自分の消しゴムだけ、すごい速さで旅立った。'],
  doubleOut: ['相手も巻き込んだが、自分も落ちた。', '一緒に落ちれば怖くない、たぶん。'],
  judgeWin: ['最後まで机の上に残った者が勝つ。', '中央キープで休み時間を制した。'],
  judgeLose: ['粘ったけど、机の端に愛されすぎた。', 'あと少し中央にいれば勝てたかもしれない。'],
  draw: ['決着つかず。次の休み時間へ持ち越し。', '机上の平和条約が結ばれました。'],
};

export const buildShareText = (
  result: Pick<ResultData, 'resultType' | 'round' | 'title' | 'dangerScore' | 'summary'> & Partial<Pick<ResultData, 'scoreResult' | 'stage'>>,
): string => {
  const candidates = shareLeadByType[result.resultType] ?? SHARE_LINES;
  const line = candidates[(result.round + result.title.length) % candidates.length] ?? result.summary;
  const gameName = GAME_TITLE.replace('\n', '');
  const scoreLine = result.scoreResult && result.scoreResult.score > 0 ? `スコア：${result.scoreResult.score.toLocaleString('ja-JP')}点 / ランク${result.scoreResult.rank}\n` : '';
  const stageLine = result.stage ? `到達ラウンド：${result.stage} / 3\n` : '';

  return `${line}
称号：${result.title}
ギリギリ度：${result.dangerScore}%
${stageLine}${scoreLine}

『${gameName}』
${HASHTAGS.join(' ')}
${OFFICIAL_SITE_URL}`;
};
