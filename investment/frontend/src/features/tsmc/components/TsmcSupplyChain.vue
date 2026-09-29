<script setup lang="ts">
const supplyChain = [
  { phenomenon: 'CoWoS 封裝產能滿載',    question: '誰在做封裝？',       targets: '日月光、矽格' },
  { phenomenon: 'AI 晶片需求爆發',       question: '伺服器要怎麼散熱？', targets: '奇鋐、雙鴻' },
  { phenomenon: '資料中心電力需求暴增',  question: '電源供應誰做？',     targets: '台達電、光寶科' },
  { phenomenon: '先進製程需要 EUV 機台', question: '設備誰供應？',       targets: 'ASML' },
]
</script>

<template>
  <div class="tsmc__section">
    <div class="tsmc__highlight">看懂台積電之後，這些問題會自然冒出來。不用死背，從台積電的運作邏輯自然推導。</div>
    <table class="tsmc__table">
      <thead>
        <tr>
          <th>台積電的現象</th>
          <th>自然延伸的問題</th>
          <th>通往的標的</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="row in supplyChain" :key="row.phenomenon">
          <td>{{ row.phenomenon }}</td>
          <td class="tsmc__question">{{ row.question }}</td>
          <td class="tsmc__targets">{{ row.targets }}</td>
        </tr>
      </tbody>
    </table>
    <div class="tsmc__how" style="margin-top: 20px">
      <span class="tsmc__how-label">下一步</span>
      從上面的標的挑一個，用同樣的四步驟流程分析一遍，這就是觸類旁通。
    </div>
  </div>
</template>
