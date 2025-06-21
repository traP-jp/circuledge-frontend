<template>
  <div class="note-view">
    <div class="header-controls">
      <div class="note-info">
        <div class="note-channel">channel:</div>
        <div class="note-tags">tags:</div>
      </div>
      <div class="note-actions">
        <button class="note-action-button">ホームへ戻る</button>
        <button class="note-action-button">編集</button>
      </div>
    </div>
    <h1 class="note-title">タイトル</h1>
    <div class="note-body">
      <p>ここにノートの内容が表示されます。</p>
      <p>ノートの内容は、ユーザーが入力したテキストや画像などを含むことができます。</p>
      <p>このセクションでは、ノートの詳細な情報を表示します。</p>
    </div>



  </div>
</template>

<script setup lang="ts">
/*
import{ref, onMounted} from 'vue';
import { useRoute } from 'vue-router';

interface Note {
  revision: string;,
  channel: string;,
  permission: string;,
  body: string;
}

const note = ref<Note>({
  revision: '',
  channel: '',
  permission: '',
  body: ''
});
*/





</script>

<style>

.header-controls {
  display: flex; /* Flexboxコンテナにする */
  justify-content: space-between; /* 左右の要素を両端に配置 */
  align-items: center; /* 垂直方向の中央に揃える */
  margin-bottom: 20px; /* タイトルとの間に少し余白 */
}

.note-info {
  display: flex; /* channelとtagsもFlexboxで横並びにする */
  align-items: center; /* 垂直方向の中央に揃える */
  gap: 20px; /* channelとtagsの間のスペース */
}
.note-channel{
  font-size:16px;
}
.note-tags{
  font-size:16px
}




.note-actions {
  display: flex;
  gap: 10px;
}
.note-action-button {
  font-size: 13px;
  width: 130px;
  height: 32px;
  margin-top: 20px;
  background-color: #58b5828a;
  border: 2px;
  border-color: #6edfa115;
  border-radius: 3px;
}
.note-action-button:hover {
  background-color: #5f8570;
  border-color: #6edfa1;
}

</style>
