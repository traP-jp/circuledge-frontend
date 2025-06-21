<template>
  <h1>Note Edit</h1>
  <div class="menu">
    <div class="note-info-container">
      <div class="note-info">
        <label for="channel">channel</label>
        <input type="text" name="channel" id="channel" placeholder="#event/hackathon/25spring/16" />
      </div>
      <div class="note-info">
        <label for="tags">tags</label>
        <input type="text" name="tags" id="tags" placeholder="tag1,tag2,tag3,tagtag" />
      </div>
    </div>
    <div class="button-container">
      <button>キャンセル</button>
      <button>保存</button>
    </div>
  </div>
</template>

<script setup lang="ts"></script>

<style scoped>
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

button {
  border-radius: 4px;
  border: 1px solid var(--border, #3f8d44);
  background: var(--background, #abd9ae);
  padding: 0.3em 1.4em;
  display: flex;
  align-items: center;
  justify-content: center;
}

.menu {
  display: flex;
  justify-content: space-between;
}

.note-info {
  display: flex;
  margin: auto 0;
  align-items: center;
  gap: 1em;
}

.note-info-container {
  display: flex;
  gap: 2em;
}

.button-container {
  display: flex;
  gap: 2em;
}
</style>
