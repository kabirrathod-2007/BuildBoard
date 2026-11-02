import { createSlice, createAsyncThunk, createSelector } from '@reduxjs/toolkit'
import {
  fetchProblems,
  fetchProblemDetails,
  createProblemApi,
  deleteProblemApi,
  toggleProblemValidationApi,
  toggleProblemTesterSignupApi,
  addProblemCommentApi,
  attachProblemSolutionApi,
} from '../../lib/api.js'

// --- Async Thunks ---

export const fetchProblemsThunk = createAsyncThunk(
  'problems/fetchProblems',
  async (params = {}, { rejectWithValue }) => {
    try {
      const res = await fetchProblems(params)
      return res?.problems || []
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch problems')
    }
  },
)

export const fetchProblemDetailsThunk = createAsyncThunk(
  'problems/fetchProblemDetails',
  async (slugOrId, { rejectWithValue }) => {
    try {
      const res = await fetchProblemDetails(slugOrId)
      return res?.problem
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to fetch problem details')
    }
  },
)

export const createProblemThunk = createAsyncThunk(
  'problems/createProblem',
  async (problemData, { rejectWithValue }) => {
    try {
      const res = await createProblemApi(problemData)
      return res?.problem
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to create problem')
    }
  },
)

export const deleteProblemThunk = createAsyncThunk(
  'problems/deleteProblem',
  async (slugOrId, { rejectWithValue }) => {
    try {
      await deleteProblemApi(slugOrId)
      return slugOrId
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to delete problem')
    }
  },
)

export const toggleProblemValidationThunk = createAsyncThunk(
  'problems/toggleValidation',
  async (slugOrId, { rejectWithValue }) => {
    try {
      const res = await toggleProblemValidationApi(slugOrId)
      return { slugOrId, ...res }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to toggle validation')
    }
  },
)

export const toggleProblemTesterSignupThunk = createAsyncThunk(
  'problems/toggleTesterSignup',
  async (slugOrId, { rejectWithValue }) => {
    try {
      const res = await toggleProblemTesterSignupApi(slugOrId)
      return { slugOrId, ...res }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to toggle tester signup')
    }
  },
)

export const addProblemCommentThunk = createAsyncThunk(
  'problems/addComment',
  async ({ slugOrId, commentData }, { rejectWithValue }) => {
    try {
      const res = await addProblemCommentApi(slugOrId, commentData)
      return { slugOrId, comment: res?.comment }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to post comment')
    }
  },
)

export const attachProblemSolutionThunk = createAsyncThunk(
  'problems/attachSolution',
  async ({ slugOrId, solutionData }, { rejectWithValue }) => {
    try {
      const res = await attachProblemSolutionApi(slugOrId, solutionData)
      return { slugOrId, solution: res?.solution }
    } catch (err) {
      return rejectWithValue(err.message || 'Failed to link solution')
    }
  },
)

// --- Slice Definition ---

const initialState = {
  items: [],
  loading: false,
  error: null,
  filters: {
    search: '',
    category: 'All',
    stage: 'All',
    sort: 'most-validated',
  },
}

export const problemsSlice = createSlice({
  name: 'problems',
  initialState,
  reducers: {
    setProblems: (state, action) => {
      state.items = action.payload || []
    },
    addProblemLocal: (state, action) => {
      const item = action.payload
      const index = state.items.findIndex(
        (p) => String(p.id) === String(item.id) || (item.slug && p.slug === item.slug),
      )
      if (index >= 0) {
        state.items[index] = { ...state.items[index], ...item }
      } else {
        state.items.unshift(item)
      }
    },
    deleteProblemLocal: (state, action) => {
      const slugOrId = String(action.payload)
      state.items = state.items.filter(
        (p) => String(p.id) !== slugOrId && p.slug !== slugOrId,
      )
    },
    toggleValidationLocal: (state, action) => {
      const { problemId, userEmail } = action.payload
      const prob = state.items.find(
        (p) => String(p.id) === String(problemId) || p.slug === String(problemId),
      )
      if (prob) {
        const normalized = (userEmail || '').toLowerCase().trim()
        const validates = Array.isArray(prob.validations) ? prob.validations : []
        const hasValidated = validates.includes(normalized)
        if (hasValidated) {
          prob.validations = validates.filter((e) => e !== normalized)
          prob.validationCount = Math.max(0, (prob.validationCount || 1) - 1)
          prob.isValidated = false
          prob.hasValidated = false
        } else {
          prob.validations = [...validates, normalized]
          prob.validationCount = (prob.validationCount || 0) + 1
          prob.isValidated = true
          prob.hasValidated = true
        }
      }
    },
    toggleTesterSignupLocal: (state, action) => {
      const { problemId, userEmail } = action.payload
      const prob = state.items.find(
        (p) => String(p.id) === String(problemId) || p.slug === String(problemId),
      )
      if (prob) {
        const normalized = (userEmail || '').toLowerCase().trim()
        const signups = Array.isArray(prob.testerSignups) ? prob.testerSignups : []
        const hasSignedUp = signups.includes(normalized)
        if (hasSignedUp) {
          prob.testerSignups = signups.filter((e) => e !== normalized)
          prob.testerSignupCount = Math.max(0, (prob.testerSignupCount || 1) - 1)
          prob.hasTesterSignedUp = false
          prob.hasSignedUp = false
        } else {
          prob.testerSignups = [...signups, normalized]
          prob.testerSignupCount = (prob.testerSignupCount || 0) + 1
          prob.hasTesterSignedUp = true
          prob.hasSignedUp = true
        }
      }
    },
    toggleNotificationLocal: (state, action) => {
      const { problemId, userEmail } = action.payload
      const prob = state.items.find(
        (p) => String(p.id) === String(problemId) || p.slug === String(problemId),
      )
      if (prob) {
        const normalized = (userEmail || '').toLowerCase().trim()
        const notifs = Array.isArray(prob.notificationSubscribers)
          ? prob.notificationSubscribers
          : []
        if (notifs.includes(normalized)) {
          prob.notificationSubscribers = notifs.filter((e) => e !== normalized)
          prob.hasNotificationSubscribed = false
        } else {
          prob.notificationSubscribers = [...notifs, normalized]
          prob.hasNotificationSubscribed = true
        }
      }
    },
    addCommentLocal: (state, action) => {
      const { problemId, comment } = action.payload
      const prob = state.items.find(
        (p) => String(p.id) === String(problemId) || p.slug === String(problemId),
      )
      if (prob) {
        prob.comments = [...(prob.comments || []), comment]
        prob.commentCount = (prob.commentCount || 0) + 1
      }
    },
    attachSolutionLocal: (state, action) => {
      const { problemId, solution } = action.payload
      const prob = state.items.find(
        (p) => String(p.id) === String(problemId) || p.slug === String(problemId),
      )
      if (prob) {
        prob.stage = 'Prototyping'
        prob.solutionCount = (prob.solutionCount || 0) + 1
        prob.solutions = [...(prob.solutions || []), solution]
      }
    },
    setProblemsFilter: (state, action) => {
      state.filters = { ...state.filters, ...action.payload }
    },
    resetProblemsFilter: (state) => {
      state.filters = initialState.filters
    },
  },
  extraReducers: (builder) => {
    // Fetch problems
    builder
      .addCase(fetchProblemsThunk.pending, (state) => {
        state.loading = true
        state.error = null
      })
      .addCase(fetchProblemsThunk.fulfilled, (state, action) => {
        state.loading = false
        state.items = action.payload || []
      })
      .addCase(fetchProblemsThunk.rejected, (state, action) => {
        state.loading = false
        state.error = action.payload || 'Failed to fetch problems'
      })

    // Fetch details
    builder.addCase(fetchProblemDetailsThunk.fulfilled, (state, action) => {
      if (action.payload) {
        const detail = action.payload
        const index = state.items.findIndex(
          (p) => String(p.id) === String(detail.id) || (detail.slug && p.slug === detail.slug),
        )
        if (index >= 0) {
          state.items[index] = { ...state.items[index], ...detail }
        } else {
          state.items.push(detail)
        }
      }
    })

    // Create problem
    builder.addCase(createProblemThunk.fulfilled, (state, action) => {
      if (action.payload) {
        state.items.unshift(action.payload)
      }
    })

    // Delete problem
    builder.addCase(deleteProblemThunk.fulfilled, (state, action) => {
      const slugOrId = String(action.payload)
      state.items = state.items.filter(
        (p) => String(p.id) !== slugOrId && p.slug !== slugOrId,
      )
    })

    // Validation toggle
    builder.addCase(toggleProblemValidationThunk.fulfilled, (state, action) => {
      const { slugOrId, validated, validationCount } = action.payload
      const prob = state.items.find(
        (p) => String(p.id) === String(slugOrId) || p.slug === slugOrId,
      )
      if (prob) {
        if (typeof validated === 'boolean') prob.isValidated = validated
        if (typeof validationCount === 'number') prob.validationCount = validationCount
      }
    })

    // Tester signup toggle
    builder.addCase(toggleProblemTesterSignupThunk.fulfilled, (state, action) => {
      const { slugOrId, signedUp, testerSignupCount } = action.payload
      const prob = state.items.find(
        (p) => String(p.id) === String(slugOrId) || p.slug === slugOrId,
      )
      if (prob) {
        if (typeof signedUp === 'boolean') prob.hasTesterSignedUp = signedUp
        if (typeof testerSignupCount === 'number') prob.testerSignupCount = testerSignupCount
      }
    })

    // Add comment
    builder.addCase(addProblemCommentThunk.fulfilled, (state, action) => {
      const { slugOrId, comment } = action.payload
      if (!comment) return
      const prob = state.items.find(
        (p) => String(p.id) === String(slugOrId) || p.slug === slugOrId,
      )
      if (prob) {
        prob.comments = [...(prob.comments || []), comment]
        prob.commentCount = (prob.commentCount || 0) + 1
      }
    })

    // Attach solution
    builder.addCase(attachProblemSolutionThunk.fulfilled, (state, action) => {
      const { slugOrId, solution } = action.payload
      if (!solution) return
      const prob = state.items.find(
        (p) => String(p.id) === String(slugOrId) || p.slug === slugOrId,
      )
      if (prob) {
        prob.stage = 'Prototyping'
        prob.solutionCount = (prob.solutionCount || 0) + 1
        prob.solutions = [...(prob.solutions || []), solution]
      }
    })
  },
})

export const {
  setProblems,
  addProblemLocal,
  deleteProblemLocal,
  toggleValidationLocal,
  toggleTesterSignupLocal,
  toggleNotificationLocal,
  addCommentLocal,
  attachSolutionLocal,
  setProblemsFilter,
  resetProblemsFilter,
} = problemsSlice.actions

// --- Selectors ---

export const selectAllProblems = (state) => state.problems.items
export const selectProblemsLoading = (state) => state.problems.loading
export const selectProblemsError = (state) => state.problems.error
export const selectProblemsFilters = (state) => state.problems.filters

export const selectProblemByIdOrSlug = (state, idOrSlug) => {
  if (!idOrSlug) return null
  const str = String(idOrSlug).toLowerCase().trim()
  return (
    state.problems.items.find(
      (p) => String(p.id).toLowerCase() === str || (p.slug && p.slug.toLowerCase() === str),
    ) || null
  )
}

export const selectUserProblems = createSelector(
  [selectAllProblems, (_state, userEmail) => (userEmail || '').toLowerCase().trim()],
  (problems, userEmail) => {
    if (!userEmail) return []
    return problems.filter(
      (p) => p.creatorEmail && p.creatorEmail.toLowerCase().trim() === userEmail,
    )
  },
)

export default problemsSlice.reducer

