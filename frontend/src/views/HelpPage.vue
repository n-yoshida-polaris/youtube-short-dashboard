<template>
  <div>
    <h1 class="text-h5 font-weight-bold mb-6">ヘルプ・使い方</h1>

    <!-- 指標説明 -->
    <v-card class="mb-6">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon start>mdi-chart-bar</v-icon>指標の説明
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th style="width: 160px">指標</th>
              <th style="width: 240px">定義</th>
              <th>意味・使い方</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>中央値再生</strong></td>
              <td>最新100本の再生数の中央値</td>
              <td>
                テーマ（チャンネル）の地力を示す最重要指標。平均ではなく中央値を使うことでバズ動画の影響を受けにくい。
                <v-chip size="x-small" color="error" class="ml-1">目安: 2,000未満は弱い</v-chip>
              </td>
            </tr>
            <tr>
              <td><strong>拡散倍率</strong></td>
              <td>中央値再生 ÷ 登録者数</td>
              <td>
                アルゴリズムにどれだけ乗れているかを示す。登録者以上に広がっているかどうかの指標。
                <div class="mt-1 d-flex gap-1 flex-wrap">
                  <v-chip size="x-small" color="error">1未満: 弱い</v-chip>
                  <v-chip size="x-small" color="info">1〜3: 普通</v-chip>
                  <v-chip size="x-small" color="success">3〜10: 強い</v-chip>
                  <v-chip size="x-small" color="purple">10超: バズ可能</v-chip>
                </div>
              </td>
            </tr>
            <tr>
              <td><strong>ヒット率</strong></td>
              <td>中央値 × 5 を超えた動画の割合</td>
              <td>
                どれくらいの頻度でヒット動画が生まれるかを示す。ヒット率が高いテーマは再現性があると判断できる。
              </td>
            </tr>
            <tr>
              <td><strong>撤退候補</strong></td>
              <td>中央値再生 &lt; 2,000 かつ 拡散倍率 &lt; 2</td>
              <td>
                地力が弱くアルゴリズムにも乗れていないチャンネル。撤退・リソース再配分の検討対象。
              </td>
            </tr>
            <tr>
              <td><strong>ヒット動画</strong></td>
              <td>再生数 &gt; チャンネル中央値 × 5</td>
              <td>
                そのチャンネルの通常より5倍以上バズった動画。タイトル・サムネ・テーマをフォーマット研究の対象にする。
              </td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- ステータス説明 -->
    <v-card class="mb-6">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon start>mdi-tag-multiple</v-icon>チャンネルステータス
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th style="width: 120px">ステータス</th>
              <th>意味</th>
              <th>判断基準の目安</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><v-chip size="small" color="success">keep</v-chip></td>
              <td>継続投稿・注力するチャンネル</td>
              <td>拡散倍率 3 以上、または成長トレンドが明確</td>
            </tr>
            <tr>
              <td><v-chip size="small" color="info">watch</v-chip></td>
              <td>様子見・判断保留</td>
              <td>開始直後で判断材料が少ない、または微妙な数値で経過観察中</td>
            </tr>
            <tr>
              <td><v-chip size="small" color="warning">prune</v-chip></td>
              <td>撤退候補・間引き予定</td>
              <td>撤退ルール（中央値 &lt; 2,000 かつ 拡散倍率 &lt; 2）に該当</td>
            </tr>
            <tr>
              <td><v-chip size="small" color="default">archived</v-chip></td>
              <td>投稿停止・アーカイブ済み</td>
              <td>撤退を実施済み。データは残すが一覧から除外可能</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- チャンネル種別 -->
    <v-card class="mb-6">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon start>mdi-account-multiple</v-icon>チャンネル種別（type）
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-table>
          <thead>
            <tr>
              <th style="width: 120px">種別</th>
              <th>対象</th>
              <th>データ収集の違い</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><v-chip size="small" color="primary">own</v-chip></td>
              <td>自分が運営するチャンネル</td>
              <td>統計を時系列で保存（6h / 24h / 48h 経過での成長が見られる）</td>
            </tr>
            <tr>
              <td><v-chip size="small" color="secondary">watch</v-chip></td>
              <td>競合・参考にする他者チャンネル</td>
              <td>最新スナップショットのみ保存。リサーチ画面で確認できる</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- 使い方ガイド -->
    <v-card class="mb-6">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon start>mdi-map-marker-path</v-icon>基本的な使い方
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-timeline side="end" density="compact">
          <v-timeline-item dot-color="primary" size="small">
            <template #opposite><span class="text-caption">STEP 1</span></template>
            <div>
              <div class="font-weight-bold">チャンネルを追加する</div>
              <div class="text-body-2 mt-1">
                「チャンネル一覧」画面の「チャンネル追加」ボタンからチャンネルIDを登録。
                自分のチャンネルは <code>own</code>、競合調査チャンネルは <code>watch</code> を選択。
                追加直後にバックグラウンドで自動収集が始まる。
              </div>
            </div>
          </v-timeline-item>

          <v-timeline-item dot-color="primary" size="small">
            <template #opposite><span class="text-caption">STEP 2</span></template>
            <div>
              <div class="font-weight-bold">指標を確認してステータスを判断する</div>
              <div class="text-body-2 mt-1">
                「チャンネル一覧」で中央値再生・拡散倍率・撤退候補フラグを確認。
                データが蓄積されてきたら各チャンネルのステータス（keep / watch / prune）を設定する。
              </div>
            </div>
          </v-timeline-item>

          <v-timeline-item dot-color="primary" size="small">
            <template #opposite><span class="text-caption">STEP 3</span></template>
            <div>
              <div class="font-weight-bold">ヒット動画からフォーマットを研究する</div>
              <div class="text-body-2 mt-1">
                「ヒット動画」画面で全チャンネルのヒット動画を一覧表示。
                タイトル・テーマ・投稿タイミングのパターンを分析して、他チャンネルに転用できるフォーマットを探す。
              </div>
            </div>
          </v-timeline-item>

          <v-timeline-item dot-color="primary" size="small">
            <template #opposite><span class="text-caption">STEP 4</span></template>
            <div>
              <div class="font-weight-bold">競合チャンネルをリサーチする</div>
              <div class="text-body-2 mt-1">
                「リサーチ」画面で <code>watch</code> チャンネルの指標を確認。
                拡散倍率が高い競合のテーマ・構成を分析して新チャンネルのヒントにする。
              </div>
            </div>
          </v-timeline-item>

          <v-timeline-item dot-color="primary" size="small">
            <template #opposite><span class="text-caption">STEP 5</span></template>
            <div>
              <div class="font-weight-bold">新チャンネルアイデアを管理する</div>
              <div class="text-body-2 mt-1">
                「アイデア候補」画面でリサーチから生まれたアイデアを記録・管理。
                draft → testing → launched のフローで進捗を追う。
              </div>
            </div>
          </v-timeline-item>
        </v-timeline>
      </v-card-text>
    </v-card>

    <!-- アイデア候補 -->
    <v-card class="mb-6">
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon start>mdi-lightbulb</v-icon>アイデア候補の使い方
      </v-card-title>
      <v-divider />
      <v-card-text>
        <p class="text-body-2 mb-4">
          リサーチや日常の観察から生まれた「新チャンネルのテーマ案」を記録・管理する画面。
          思いついたアイデアを溜めておき、優先度や検証結果をステータスで追跡する。
        </p>

        <div class="font-weight-bold mb-2">ステータスのフロー</div>
        <div class="d-flex align-center flex-wrap gap-2 mb-4">
          <v-chip size="small" color="default">draft</v-chip>
          <v-icon size="small">mdi-arrow-right</v-icon>
          <v-chip size="small" color="info">testing</v-chip>
          <v-icon size="small">mdi-arrow-right</v-icon>
          <v-chip size="small" color="success">launched</v-chip>
          <span class="text-body-2 mx-2">または</span>
          <v-chip size="small" color="error">dropped</v-chip>
        </div>

        <v-table density="compact" class="mb-4">
          <thead>
            <tr>
              <th style="width: 100px">ステータス</th>
              <th>意味・タイミング</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><v-chip size="x-small" color="default">draft</v-chip></td>
              <td>アイデアを思いついた段階。まだ検証も開始していない</td>
            </tr>
            <tr>
              <td><v-chip size="x-small" color="info">testing</v-chip></td>
              <td>チャンネルを作成して試験投稿中。データ収集フェーズ</td>
            </tr>
            <tr>
              <td><v-chip size="x-small" color="success">launched</v-chip></td>
              <td>本格運用に移行。チャンネル一覧で <code>own</code> として管理</td>
            </tr>
            <tr>
              <td><v-chip size="x-small" color="error">dropped</v-chip></td>
              <td>検証の結果、見込みなしと判断して破棄</td>
            </tr>
          </tbody>
        </v-table>

        <div class="font-weight-bold mb-2">各フィールドの使い方</div>
        <v-table density="compact">
          <thead>
            <tr>
              <th style="width: 140px">フィールド</th>
              <th>記入内容の例</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>テーマ</strong></td>
              <td>「ミニマリスト生活 Shorts」「1分英会話フレーズ」など、チャンネルの軸となるテーマ名</td>
            </tr>
            <tr>
              <td><strong>参考チャンネル</strong></td>
              <td>アイデアの元になった競合チャンネルのID・名前。カンマ区切りで複数可</td>
            </tr>
            <tr>
              <td><strong>メモ</strong></td>
              <td>差別化ポイント、想定フォーマット、懸念点など自由記述</td>
            </tr>
          </tbody>
        </v-table>
      </v-card-text>
    </v-card>

    <!-- 撤退判断フロー -->
    <v-card>
      <v-card-title class="text-subtitle-1 font-weight-bold">
        <v-icon start>mdi-trending-down</v-icon>撤退判断の考え方
      </v-card-title>
      <v-divider />
      <v-card-text>
        <v-alert type="warning" variant="tonal" class="mb-4">
          <strong>撤退ルール:</strong> 中央値再生 &lt; 2,000 <strong>かつ</strong> 拡散倍率 &lt; 2 が一定期間続いた場合
        </v-alert>
        <p class="text-body-2">
          撤退ルールに該当しても即撤退ではなく、以下の観点で総合判断する：
        </p>
        <v-list density="compact" class="mt-2">
          <v-list-item prepend-icon="mdi-clock-outline">
            <strong>投稿本数が少ない場合</strong>（20本未満）はデータ不足のため経過観察
          </v-list-item>
          <v-list-item prepend-icon="mdi-trending-up">
            <strong>トレンドが改善中</strong>（直近10本の中央値が上昇傾向）なら継続
          </v-list-item>
          <v-list-item prepend-icon="mdi-calendar-check">
            <strong>季節性・イベント要因</strong>がある場合は時期を変えて再評価
          </v-list-item>
          <v-list-item prepend-icon="mdi-fire">
            <strong>ヒット動画が1本でもある</strong>場合はフォーマットを磨く余地あり
          </v-list-item>
        </v-list>
      </v-card-text>
    </v-card>
  </div>
</template>

<script setup lang="ts">
// static page, no logic needed
</script>
