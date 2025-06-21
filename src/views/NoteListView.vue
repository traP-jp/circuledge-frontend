<template>

  <div class="search">
  <div class="box">
  <p>チャンネル:</p>
  <input type="search" id="channel" name="search">
  <button onclick="channel()" ><img src="../assets/検索_mock.png" width="25px" height="25px"/></button>
  <input type="checkbox" checked>
  <p>子チャンネルを含む</p>
  </div>
  <div class="box">
  <p>キーワード:</p>
  <input type="search" id="keywords">
  <button onclick="keywords()"><img src="../assets/検索_mock.png" width="25" height="25"/></button>
  </div>
  <button onclick="setting()" id="setting">設定</button>
  <button onclick="newnote()" id="newnote">新規ノートを追加</button>
  </div><br>

  <div class="sort">
  <button onclick="datesort()" id="datesort">日時順でソート</button>
  <button onclick="titlesort()" id="titlesort">タイトル順でソート</button>
  </div>
</template>

<script setup lang="ts">



</script>

<style>  
  .search {
    height: auto;
    display: flex;
    flex-direction: row;
    align-items: center;
    white-space: nowrap;
    gap: 20px
  }
  .box {
    height: 29px;
    display: flex;
    flex-direction: row;
    align-items: center;
    font-size: 29px;

  }

  #newnote {
    background: #ABD9AE;
    height: 48px;
    border-width: 1px ;
    border-color: #3F8D44;
    align-items: center;
    
  

  }
  #setting {
    height: 29px;
    align-items: center;
    line-height: 29px;
   text-align: center;
  }


  input[type="search"] {
    height: 29px;
    align-items: center;
  }

  button {
    height: 29px;
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
    gap: 24px;
    font-size: 29px;
    margin-left:150px;
  }
  #datesort, #titlesort {
    height: 47px;
    border-width: 1px ;
  }
  input[type=checkbox] {
    height: 29px;
    width: 29px;
    margin: 0 8px;
    transform: scale(0.8);
  }

  
</style>