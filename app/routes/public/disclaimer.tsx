import type { Route } from "./+types/disclaimer";

export const meta: Route.MetaFunction = () => [
  { title: "免責事項・著作権表記 | ポッ拳フレーム表" },
  {
    name: "description",
    content:
      "本サイトは非公式のファンサイトであり、権利者とは一切関係ありません。",
  },
  { name: "robots", content: "noindex, nofollow" },
];

/**
 * 免責・著作権表記ページ。
 * 非公式ファンサイトであること、権利者と無関係であること、データの正確性を保証しないことを明示し、
 * 他社IPを扱う上での立場を来訪者に対して明確にする。
 */
export default function DisclaimerPage() {
  return (
    <>
      <div className="page-head">
        <h1 className="page-title">免責事項・著作権表記</h1>
        <p className="page-lead">本サイトの位置づけと取り扱いについて。</p>
      </div>

      <section className="prose">
        <h2>非公式のファンサイトについて</h2>
        <p>
          本サイトは、非公式のファンサイトです。
          株式会社ポケモン、任天堂株式会社、株式会社バンダイナムコエンターテインメント、
          およびその他の権利者とは一切関係ありません。
        </p>

        <h2>著作権について</h2>
        <p>
          「ポッ拳」「POKKÉN TOURNAMENT」をはじめとする作品名・キャラクター名・画像等の著作権は、
          それぞれの権利者に帰属します。本サイトはこれらの権利を侵害する意図を持つものではありません。
        </p>

        <h2>掲載内容について</h2>
        <p>
          本サイトに掲載するフレームデータ等は、公式の見解・データを表すものではなく、
          その正確性・完全性・最新性を保証しません。本サイトの情報の利用によって生じた
          いかなる損害についても、運営者は責任を負いません。
        </p>

        <h2>お問い合わせ</h2>
        <p>
          掲載内容の誤りのご指摘やお問い合わせは、以下の Google フォームよりお寄せください。
        </p>
        <p>
          <a
            href="https://docs.google.com/forms/d/e/1FAIpQLSd8ZyIiHQ6psjtkQM2sTbszGZjYW6THIICdTYruSVZljveYIQ/viewform"
            target="_blank"
            rel="noopener noreferrer"
          >
            お問い合わせフォーム
          </a>
        </p>
      </section>
    </>
  );
}
