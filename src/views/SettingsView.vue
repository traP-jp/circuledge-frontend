<template>
  <div class="settings-container">
    <h1>設定</h1>

    <div class="setting-channel">
      <p>デフォルトのチャンネル：</p>
      <input type="text" placeholder="チャンネルを検索" class="channel-search-box" />
      <div class="serch-channel"></div>
    </div>
    <div class="setting-theme">
      <p>テーマ：</p>
    </div>
    <button class="action-button">保存</button>
  </div>



</template>

<script setup lang="ts">

</script>
<style>
h1 {
  font-size: 24px;
  margin-bottom: 20px;
  color: #333;
}

.settings-container {
  max-width: 800px;
  margin: auto;

}

.setting-channel {
  margin-bottom: 20px;
  display: flex;
}

.channel-search-box {
  width: 220px;
  padding: 8px 12px;
  font-size: 14px;
  border: 1px solid #bdbdbd;
  border-radius: 4px;
  margin-bottom: 12px;
  outline: none;
  transition: border-color 0.2s;
  padding-right: 36px;
  position: relative;
}
.channel-search-box:focus {
  border-color: #58b582;
  background-color: #f6fff9;
}
p{
  font-size: 14px;
  margin-bottom: 10px;
}

.action-button{
  font-size: 13px;
  width: 130px;
  height: 32px;
  margin-top: 20px;
  background-color: #58b5828a;
  border: 2px;
  border-color: #6edfa115;
  border-radius: 3px;
}
</style>
