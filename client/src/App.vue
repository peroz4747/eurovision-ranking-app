<template>
  <div id="app">
    <h1>Eurovision Song Contest Ranking</h1>
    <ul>
      <li v-for="entry in rankings" :key="entry.country" :draggable="true" @dragstart="dragStart(entry, $event)">
        {{ entry.flag }} {{ entry.country }} - {{ entry.score }}pts
      </li>
    </ul>
    <div id="dropAreas">
      <div :key="point" v-for="point in points" class="drop-area-wrapper">{{ point }}pts<div class="drop-area" :id="point + 'pts'" @dragover.prevent @drop="drop($event, point)" @dragleave="dragLeave($event)">drop here</div></div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import io, { Socket } from 'socket.io-client';

// Define an interface for the structure of ranking data
interface Ranking {
  country: string;
  flag: string;
  score: number;
}

const points = [12, 10, 8, 7, 6, 5, 4, 3, 2, 1]

// Use ref with a type annotation to help TypeScript infer the type of the reactive data
const rankings = ref<Ranking[]>([]);
const droppedCountries = ref<string[]>([]); // Keep track of dropped countries

// Declare socket with a proper type
const socket = ref<Socket | null>(null);

const rankCountry = (country: string, score: number): void => {
  const index = rankings.value.findIndex(entry => entry.country === country);
  if (index !== -1) {
    rankings.value[index].score = score;
    // Emit an event to the server
    if (socket.value) {
      socket.value.emit('rank', { country, score });
    }
  }
};

const dragStart = (entry: Ranking, event: DragEvent) => {
  event.dataTransfer?.setData('text/plain', JSON.stringify(entry));
};

const drop = (event: DragEvent, score: number) => {
  event.preventDefault();
  const data = JSON.parse(event.dataTransfer!.getData('text/plain'));
  const currentCountry = event.currentTarget.textContent
  // Check if the country has already been dropped
  if (currentCountry !== "drop here") {
    rankCountry(currentCountry, 0)
    const index = droppedCountries.value.indexOf(currentCountry);
    droppedCountries.value.splice(index, 1);
    event.currentTarget.textContent = '';
  }

  const index = droppedCountries.value.indexOf(data.country);
  if (index !== -1) {
    droppedCountries.value.splice(index, 1);
    const foundElement = Array.from(document.querySelectorAll('.drop-area')).find(ele => ele.textContent === data.country);
    if (foundElement) {
      foundElement.textContent = 'drop here';
    }
  }


  rankCountry(data.country, score);
  droppedCountries.value.push(data.country); // Add the country to dropped list
  event.currentTarget.textContent = data.country;

};

const dragLeave = (event: DragEvent) => {
  event.preventDefault();
  const data = JSON.parse(JSON.stringify(event.dataTransfer!.getData('text/plain')));
  const index = droppedCountries.value.indexOf(data.country);
  if (index !== -1) {
    droppedCountries.value.splice(index, 1);
    rankCountry(data.country, 0); // Reset score to 0 if dragged out
    event.currentTarget.textContent = "drop here";
  }
};

onMounted(() => {
  // Assuming you're still getting the initial rankings from the server
  socket.value = io('http://192.168.1.192:3000');
  socket.value.on('data', (data: string) => {
    console.log('Received data:', data); // Log the received data
    try {
      const parsedData = JSON.parse(JSON.stringify(data));
      parsedData.forEach(d => {
        document.getElementById(`${d.score.toString()}pts`).textContent = d.country;
      });
    } catch (error) {
      console.error('Error parsing JSON data:', error);
    }
  });

  socket.value.on('update', (data: Ranking[]) => {
    rankings.value = data;
  });
});
</script>

<style scoped>
h1 {
  margin: 20px;
  text-align: center;
}

ul {
  list-style: decimal-leading-zero;
  columns: 2;
  font-size: 14pt;
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
