<template>

  <div class="search">
    <div class="box">
      <p>チャンネル:</p>
      <input type="search" id="channel" name="search">
      <button @click="Channel()"><img src="../assets/search_mock.png" width="25px" line-height="25px" /></button>
      <input type="checkbox" name="childchannel" id="childchannel" checked>
      <label for="childchannel">子チャンネルを含む</label>
    </div>
    <div class="box">
      <p>キーワード:</p>
      <input type="search" id="keywords">
      <button @click="Keywords()"><img src="../assets/search_mock.png" width="25" line-height="25" /></button>
    </div>
    <button @click="Setting()" id="setting">設定</button>
    <button @click="Newnote()" id="newnote">新規ノートを追加</button>
  </div><br>

  <div class="sort">
    <button @click="Datesort()" id="datesort">日時順でソート</button>
    <button @click="Titlesort()" id="titlesort">タイトル順でソート</button>
  </div>
  <a href="/notes/:noteId/view">About</a>
</template>

<script setup lang="ts">


const Channel = () => {
  if (document.querySelector("#channel").value !== "") {
    let channel = document.querySelector("#channel").value;
    console.log(channel);
  }

}
const Keywords = () => {
  if (document.querySelector("#keywords").value !== "") {
    let keywords = document.querySelector("#keywords").value;
    console.log(keywords);
  }
}
const Setting = () => {
  // 設定画面へ遷移
  window.Location.href = "/settings";
}
const Newnote = async () => {
  try {
    const url = '/notes';
    const res = await fetch(url);
    const data = await res.json();
    console.log(data)
  } catch (e) {
    console.error(e);
  }
}

// ソート
let datesort = true;
let titlesort = true;
let sort_order: string = "date"; // 初期は日付順
const Datesort = () => {
  datesort = !datesort; // 昇降順を切り替え
  sort_order = "date"; //日付順に設定
}
const Titlesort = () => {
  titlesort = !titlesort; // 昇降順を切り替え
  sort_order = "title"; //タイトル順に設定
}
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
  line-height: 29px;
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