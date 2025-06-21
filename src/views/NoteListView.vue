<template>

  <div class="search">
    <div class="box">
      <p>チャンネル:</p>
      <input type="search" id="channel" v-model="channel">
      <button @click="Channel()" aria-label="検索開始"><img src="../assets/search_mock.png" class="loupe" /></button>
      <input type="checkbox" name="childchannel" id="childchannel" checked>
      <label for="childchannel">子チャンネルを含む</label>
    </div>
    <div class="box">
      <p>キーワード:</p>
      <input type="search" id="keywords" v-model="keywords">
      <button @click="keyWords()" aria-label="検索開始"><img src="../assets/search_mock.png" class="loupe" /></button>
    </div>
    <button @click="Setting()" class="btn-setting">設定</button>
    <button @click="creatNewNote()" class="btn-creatnewnote">新規ノートを追加</button>
  </div><br>

  <div class="sort">
    <button @click="dateSort()" id="datesort">日時順でソート</button>
    <button @click="titleSort()" id="titlesort">タイトル順でソート</button>
  </div>
  <br>
  <div class="note-list">

    <div>
      <div class="note_title">asd <br></div>
      <div class="note_abstruct">nm<br></div>
      <div class="note_channel">ga<br></div>
      <div class="note_date">fga</div>
    </div>
    <div>asd</div>
    <div>asd</div>
    <div>asd</div>

  </div>

</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useRouter } from 'vue-router';

const channel = ref("")
const keywords = ref("")
const Channel = () => {
  if (channel.value !== "") {
    console.log(channel.value);
  }
}
const keyWords = () => {

  if (keywords.value !== "") {
    console.log(keywords.value);
  }
}

const router = useRouter();
const Setting = () => {
  router.push('/settings');
};
import { createNote } from '../api/client.ts';
const creatNewNote = () => {
  const note = createNote();
  router.push('/notes/' + note.id + '/edit');//undefinedが返ってきたので放置


}

// ソート
let datesort = true;
let titlesort = true;
let sort_order: string = "date"; // 初期は日付順
const dateSort = () => {
  datesort = !datesort; // 昇降順を切り替え
  sort_order = ref("date").value; //日付順に設定
}
const titleSort = () => {
  titlesort = !titlesort; // 昇降順を切り替え
  sort_order = ref("title").value; //タイトル順に設定
}
</script>

<style>
input {
  padding: 0.5em;
  width: 220px;
  font-size: 14px;
  border: 1px solid #bdbdbd;
  border-radius: 4px;
  outline: none;
  transition: border-color 0.2s;
  position: relative;

  :focus {
    border-color: #58b582;
    background-color: #f6fff9;
  }
}

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

.loupe {
  cursor: pointer;
  width: 25px;
  line-height: 25px;

}

.btn-setting {
  line-height: 29px;
  align-items: center;
  line-height: 29px;
  text-align: center;
}

.btn-creatnewnote {
  background: #ABD9AE;
  line-height: 48px;
  border-width: 1px;
  border-color: #3F8D44;
  align-items: center;
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
  background-color: rgb(243, 243, 243);
  border-color: black;
  border-width: 3px;
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
  line-height: 47px;
  border-width: 1px;
}

.note-list {
  display: flex;
  flex-wrap: wrap;
}

.note-list>div {
  width: 45%;
  margin: 2.5%;
  box-sizing: border-box;
  background-color: #f0f0f0;
  border: 1px solid #ccc;
  border-radius: 5px;
  text-anchor: start;

  font-size: 30px;
}
</style>