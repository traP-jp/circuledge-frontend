<template>

  <div class="search">
    <div class="box">
      <p>チャンネル:</p>
      <input type="search" id="channel" name="search">
      <button @click="channel()"><img src="../assets/search_mock.png" width="25px" line-height="25px" /></button>
      <input type="checkbox" checked>
      <p>子チャンネルを含む</p>
    </div>
    <div class="box">
      <p>キーワード:</p>
      <input type="search" id="keywords">
      <button @click="keywords()"><img src="../assets/search_mock.png" width="25" line-height="25" /></button>
    </div>
    <button @click="setting()" id="setting">設定</button>
    <button @click="newnote()" id="newnote">新規ノートを追加</button>
  </div><br>

  <div class="sort">
    <button @click="datesort()" id="datesort">日時順でソート</button>
    <button @click="titlesort()" id="titlesort">タイトル順でソート</button>
  </div>
</template>

<script setup lang="ts">


</script>

<style>
.search {
  line-height: auto;
  display: flex;
  flex-direction: row;
  align-items: center;
  white-space: nowrap;
  gap: 20px
}

.box {
  line-height: 29px;
  display: flex;
  flex-direction: row;
  align-items: center;
  font-size: 29px;

}

#newnote {
  background: #ABD9AE;
  line-height: 48px;
  border-width: 1px;
  border-color: #3F8D44;
  align-items: center;
}

#setting {
  line-height: 29px;
  align-items: center;
  line-line-height: 29px;
  text-align: center;
}


input[type="search"] {
  line-height: 29px;
  align-items: center;
}

input[type=checkbox] {
  line-height: 29px;
  width: 29px;
  margin: auto;
  transform: scale(1.6);
}

button {
  line-height: 29px;
  cursor: pointer;
  background-color: white;
  border-width: 1px;
  border-radius: 5px;
  font-size: 29px;
  align-items: center;
}

.sort {
  display: flex;
  flex-direction: row;
  align-items: center;
  white-space: nowrap;
  gap: 10px;
  font-size: 29px;
  justify-content: center;
}

#datesort,
#titlesort {
  line-height: 47px;
  border-width: 1px;
}
</style>