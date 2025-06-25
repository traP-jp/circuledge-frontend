<template>
  <div class="note-card" tabindex="0">
    <div class="note-card-content">
      <h3 class="note-title">{{ title }}</h3>
      <p class="note-abstract">{{ abstract }}</p>
    </div>
    <div class="note-card-footer">
      <span class="note-channel">#{{ channel }}</span>
      <span class="note-date">{{ date }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  title: string;
  abstract: string;
  channel: string;
  date: string;
}>();
</script>

<style scoped>
/* --- カード全体 (Figmaデザイン反映) --- */
.note-card {
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: 8px;
  padding: 15px 40px;
  height: 175px;
  border: 1px solid #000;
  border-radius: 4px;
  background-color: white;
  cursor: pointer;
  transition: transform 0.2s;
  font-family: 'Inter', sans-serif; /* カード全体にフォントを適用 */
  overflow: hidden; /* 子要素のはみ出し防止 */
}

.note-card:hover,
.note-card:focus {
  outline: none;
  transform: translateY(-4px);
}

.note-card-content {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
  width: 100%;
  overflow: hidden;
}

/* --- カードのタイトル --- */
.note-title {
  color: #000;
  font-family: inherit; /* 親から継承 */
  font-size: 24px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  width: 100%;
}

/* --- カードの本文 --- */
.note-abstract {
  color: #000;
  font-family: inherit; /* 親から継承 */
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
  margin: 0;
  /* 複数行でのテキスト切り詰め */
  display: -webkit-box;
  -webkit-line-clamp: 2; /* 2行で切り詰める */
  line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;
}

/* --- フッターコンテナ --- */
.note-card-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  align-self: stretch;
  color: #666;
  font-family: inherit; /* 親から継承 */
  font-size: 16px;
  font-style: normal;
  font-weight: 400;
  line-height: normal;
}

/* --- 日付表示 --- */
.note-date {
  text-align: right;
  /* スタイルはフッターから継承 */
}

/* --- レスポンシブ対応 --- */
@media (max-width: 768px) {
  .note-card {
    padding: 15px 20px;
    height: auto;
    min-height: 150px;
  }
  .note-title {
    font-size: 20px;
  }
  .note-abstract,
  .note-card-footer {
    font-size: 14px;
  }
}
</style>
