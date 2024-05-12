<template>
    <li class="ranking-item" :class="entry.country" @click="setSelectedItem(entry)">
        <div class="item country">{{ entry.flag }} {{ entry.country }}</div>
        <div class="item user-score">{{ getUserScoreForCountry(entry.country) }}</div>
        <div class="item total-score">{{ entry.score }}</div>
    </li>
</template>
  
<script setup lang="ts">
import { PropType } from 'vue';
import { Ranking } from '../stores/types'
import { useRankingStore } from '../stores/rankings';

defineProps({
    entry: {
        type: Object as PropType<Ranking>,
        required: true
    }
});

const rankingsStore = useRankingStore();

const setSelectedItem = (item: any) => rankingsStore.setSelectedItem(item)
const getUserScoreForCountry = (country: string) => rankingsStore.getUserScoreForCountry(country)

</script>
  
<style scoped>
.ranking-item {
    display: inline-grid;
    grid-template-columns: calc(100% - 100px) 50px 50px;
}
.item {
    width: fit-content;
}
.user-score {
    background: linear-gradient(360deg, transparent, #7705cd, transparent 100%);
    height: fit-content;
}
</style>