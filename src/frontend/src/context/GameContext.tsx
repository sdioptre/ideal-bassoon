import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { io, Socket } from 'socket.io-client'

export type GameStatus = 'CREATED' | 'JOINED' | 'READY' | 'RACING' | 'FINISHED'

export interface Player {
  id: string
  username: string
  position: number
  wpm: number
  accuracy: number
  isReady: boolean
}

export interface GameState {
  roomId: string
  passage: string
  status: GameStatus
  players: Player[]
  currentPlayerId: string | null
  startTime: number | null
  endTime: number | null
}

interface GameContextType {
  gameState: GameState
  socket: Socket | null
  connect: (roomId: string) => void
  disconnect: () => void
  updatePlayerPosition: (position: number) => void
  setReady: (isReady: boolean) => void
  resetGame: () => void
}

const GameContext = createContext<GameContextType | undefined>(undefined)

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:4000'

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>({
    roomId: '',
    passage: '',
    status: 'CREATED',
    players: [],
    currentPlayerId: null,
    startTime: null,
    endTime: null,
  })

  const [socket, setSocket] = useState<Socket | null>(null)

  useEffect(() => {
    const newSocket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    newSocket.on('connect', () => {
      console.log('Connected to socket server')
    })

    newSocket.on('game-state-update', (state: GameState) => {
      setGameState((prev) => ({ ...prev, ...state }))
    })

    newSocket.on('player-joined', (player: Player) => {
      setGameState((prev) => ({
        ...prev,
        players: [...prev.players, player],
      }))
    })

    newSocket.on('player-left', (playerId: string) => {
      setGameState((prev) => ({
        ...prev,
        players: prev.players.filter((p) => p.id !== playerId),
      }))
    })

    newSocket.on('game-started', (startTime: number) => {
      setGameState((prev) => ({ ...prev, status: 'RACING', startTime }))
    })

    newSocket.on('game-finished', (endTime: number) => {
      setGameState((prev) => ({ ...prev, status: 'FINISHED', endTime }))
    })

    newSocket.on('disconnect', () => {
      console.log('Disconnected from socket server')
    })

    setSocket(newSocket)

    return () => {
      newSocket.disconnect()
    }
  }, [])

  const connect = (roomId: string) => {
    if (socket) {
      socket.emit('join-room', roomId)
      setGameState((prev) => ({ ...prev, roomId }))
    }
  }

  const disconnect = () => {
    if (socket) {
      socket.disconnect()
      setSocket(null)
    }
  }

  const updatePlayerPosition = (position: number) => {
    if (socket && gameState.currentPlayerId) {
      socket.emit('update-position', {
        playerId: gameState.currentPlayerId,
        position,
      })
    }
  }

  const setReady = (isReady: boolean) => {
    if (socket && gameState.currentPlayerId) {
      socket.emit('set-ready', {
        playerId: gameState.currentPlayerId,
        isReady,
      })
    }
  }

  const resetGame = () => {
    setGameState({
      roomId: '',
      passage: '',
      status: 'CREATED',
      players: [],
      currentPlayerId: null,
      startTime: null,
      endTime: null,
    })
  }

  return (
    <GameContext.Provider
      value={{
        gameState,
        socket,
        connect,
        disconnect,
        updatePlayerPosition,
        setReady,
        resetGame,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider')
  }
  return context
}
