<template>
  <div id="app">
    <h1>Eurovision Song Contest Ranking</h1>
    <ul>
      <ranking-item v-for="entry in rankings" :key="entry.country" :entry="entry" />
    </ul>
    <selection-navbar/>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from 'vue';
import { useRankingStore } from './stores/rankings';
import RankingItem from './components/RankingItem.vue';
import SelectionNavbar from './components/SelectionNavbar.vue'; 
import { storeToRefs } from 'pinia';

const rankingsStore = useRankingStore();

const { rankings } = storeToRefs(rankingsStore)

onMounted(() => {
  rankingsStore.setSocket();
});
</script>

<style scoped>
h1 {
  margin: 20px;
  text-align: center;
}

ul {
  list-style: decimal-leading-zero;
  font-size: 14pt;
  padding-bottom: calc(100vh * 0.15);
}

ul > li {
  padding: 10px;
  margin: 10px 0;
  border: 1px solid white;
  border-radius: 10px;
  width: calc(100% - 20px);
  background: linear-gradient(to left, rgba(250, 128, 114, 0) 50%, rgb(105, 27, 141) 50%) right;
  background-size: 200%;
  transition: .5s ease-out;
}
ul > li:hover {
  background-position: left;
}

#dropAreas {
  display: inline-flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-top: 20px;
  text-align: center;
  padding: 40px;
}

.drop-area-wrapper {
  padding: 10px;
  width: 160px;
}

.drop-area {
  width: 100%;
  height: 40px;
  border: 2px dashed #000;
  text-align: center;
  line-height: 40px;
  cursor: pointer;
}
</style>
