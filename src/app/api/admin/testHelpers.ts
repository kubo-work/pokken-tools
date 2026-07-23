/** admin API ルートテスト共通のエラーメッセージ抽出。Response.json() の型が unknown のため断定する。 */
export const errorMessageOf = async (response: Response): Promise<string> => {
  const body = (await response.json()) as { error: string };
  return body.error;
};
