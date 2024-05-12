import { defineStore } from 'pinia';
import io from 'socket.io-client';
import { Ranking, State } from './types';

export const useRankingStore = defineStore('rankings', {
  state: (): State => ({
    rankings: [],
    userScores: [],
    socket: null,
    availablePoints:[],
    selectedItem: null,
    pointingSystemOfficial: true,
  }),
  actions: {
    setSocket() {
      this.socket = io('http://192.168.1.192:3000');
      this.socket.on('update', (data: Ranking[]) => {
        this.rankings = data;
      });
      this.socket.on('data', (data: Ranking[]) => {
        if (this.pointingSystemOfficial) {
          this.userScores = data
        } else {
          this.userScores = data.map(us => {
            const reversedPoints = [...this.availablePoints].reverse()
            return { country: us.country, flag: us.flag, score: reversedPoints[us.score - 1]}
          })
        }
      })
      this.socket.on('points', (points: number[]) => {
        this.availablePoints = points
      })
      this.socket.on('pointingSystemOfficial', (bool: boolean) => {
        this.pointingSystemOfficial = bool
      })
    },
    scoreCountry(item: Ranking, score: number) {
      const rankingsIndex = this.rankings.findIndex((entry: Ranking) => entry.country === item.country);
      if (rankingsIndex !== -1 && this.socket) {
          this.socket.emit('rank', { country: item.country, score });
      }
      
      const userScoreCountryIndex = this.userScores.findIndex((entry: Ranking) => entry.country === item.country);
      if (userScoreCountryIndex !== -1) {
        this.userScores[userScoreCountryIndex].score = score
      } else {
        this.userScores.push({ ...item, score })
      }
    },
    rankCountry(item: Ranking, score: number) {
      const reversedPoints = [...this.availablePoints].reverse()
      const point = reversedPoints[score - 1]

      const rankingsIndex = this.rankings.findIndex((entry: Ranking) => entry.country === item.country);
      if (rankingsIndex !== -1 && this.socket) {
          this.socket.emit('rank', { country: item.country, score: point });
      }
      
      const userScoreCountryIndex = this.userScores.findIndex((entry: Ranking) => entry.country === item.country);
      if (userScoreCountryIndex !== -1) {
        this.userScores[userScoreCountryIndex].score = score
      } else {
        this.userScores.push({ ...item, score })
      }
    },
    setSelectedItem(item: any) {
      this.selectedItem = item
    }
  },
  getters: {
    getUserScoreForCountry: (state) => (country: string): number | undefined => {
      const score = state.userScores.find(us => us.country === country)?.score
      return score === 0 ? undefined : score
    },
  }
});
