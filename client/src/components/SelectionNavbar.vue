<template>
    <div v-if="ptsSelection" class="pts-selection-menu">
        <div v-for="point in availablePoints" :key="point" class="pts-selection" @click="rankCountry(point)">{{ point }}</div>
    </div>
    <nav class="navbar" v-if="selectedItem">
        <div class="selected-country">{{ selectedItem.flag }} {{ selectedItem.country }}</div>
        <div class="pts-action">
            <div class="user-pts">
                <label>Your {{ pointingSystemOfficial ? 'pts' : 'rank' }}</label>
                <div>{{ getUserScoreForCountry(selectedItem.country) || 0 }}</div>
            </div>
            <div class="user-select-points-wrapper">
                <div class="user-select-points-button" @click="togglePtsSelection">
                    Select {{ pointingSystemOfficial ? 'pts' : 'rank' }}
                </div>
            </div>
        </div>
    </nav>
</template>
  
<script setup lang="ts">
import { storeToRefs } from 'pinia';
import { useRankingStore } from '../stores/rankings';
import { ref } from 'vue';

var ptsSelection = ref(false)

const togglePtsSelection = () => {
    ptsSelection.value = !ptsSelection.value
}

const rankingsStore = useRankingStore();

const { selectedItem, availablePoints, pointingSystemOfficial } = storeToRefs(rankingsStore)

const getUserScoreForCountry = (country: string) => rankingsStore.getUserScoreForCountry(country)
const rankCountry = (score: number) => {
    if (selectedItem.value) {
        pointingSystemOfficial.value ? rankingsStore.scoreCountry(selectedItem.value, score) : rankingsStore.rankCountry(selectedItem.value, score)
    }
    togglePtsSelection()
}

</script>

<style scoped>
.navbar {
    position: fixed;
    bottom: 0;
    background: rgb(106, 17, 179);
    width: 100%;
    height: 10%;
    font-size: 16pt;
    align-items: center;
    transition: 0.5s;
    padding: 10px;
    display: inline-grid;
    grid-template-columns: calc(100% - 200px) 200px;
}

.pts-action {
    display: inline-flex;
    text-align: center;
}

.user-pts {
    font-size: 14pt;
    width: 100px;
}

.pts-selection-menu {
    position: fixed;
    display: -webkit-inline-box;
    bottom: 10%;
    width: 100%;
    right: 0;
    background: rgb(196, 21, 202);
    font-size: x-large;
    text-align: center;
    transition: 0.5s;
    overflow: auto;
}

.pts-selection {
    padding: 5px;
    transition: 0.3s;
    width: 70px;
}

.pts-selection:hover {
    background: rgb(106, 17, 179);
}


.user-select-points-wrapper {
    transition: 0.5s;
    height: 60px;
    align-items: center;
    display: flex;
    border-radius: 5px;
}

.user-select-points-wrapper:hover {
    background: rgb(196, 21, 202);
}

.user-select-points-button {
    font-size: 14pt;
    padding: 10px;
}
</style>
  