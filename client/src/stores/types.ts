import { Socket } from "socket.io-client";

export type State = {
    rankings: Ranking[],
    userScores: Ranking[],
    socket: Socket | null
    availablePoints: number[]
    selectedItem: Ranking | null
    pointingSystemOfficial: boolean
}

export type Ranking = {
    country: string
    flag: string
    score: number
} 