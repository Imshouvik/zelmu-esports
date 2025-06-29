import { createSlice, PayloadAction } from '@reduxjs/toolkit'

interface Tournament {
  id: string
  title: string
  game: 'BGMI' | 'Free Fire' | 'Football'
  startDate: string
  endDate: string
  prizePool: number
  registrationFee: number
  maxTeams: number
  currentTeams: number
  status: 'upcoming' | 'ongoing' | 'completed'
  type: 'open' | 'club'
  is_featured: boolean
  is_upcoming: boolean
  rules: string[]
  rewards: {
    position: number
    amount: number
  }[]
  created_by?: string
  created_at?: string
}

interface TournamentState {
  tournaments: Tournament[]
  selectedTournament: Tournament | null
  loading: boolean
  error: string | null
}

const initialState: TournamentState = {
  tournaments: [],
  selectedTournament: null,
  loading: false,
  error: null,
}

const tournamentSlice = createSlice({
  name: 'tournaments',
  initialState,
  reducers: {
    setTournaments: (state, action: PayloadAction<Tournament[]>) => {
      state.tournaments = action.payload
      state.error = null
    },
    setSelectedTournament: (state, action: PayloadAction<Tournament>) => {
      state.selectedTournament = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string>) => {
      state.error = action.payload
      state.loading = false
    },
  },
})

export const { setTournaments, setSelectedTournament, setLoading, setError } = tournamentSlice.actions
export default tournamentSlice.reducer 