import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react';
import type { AppState, AppAction } from '@/types';
import { getParent, getChildren, getStreak } from '@/services/storage';

const initialState: AppState = {
  parent: null,
  children: [],
  activeChild: null,
  isOnboarded: false,
  darkMode: false,
  todayQuestions: [],
  todaySession: null,
  streak: null,
  isLoading: true,
};

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_PARENT':
      return { ...state, parent: action.payload };
    case 'SET_CHILDREN':
      return { ...state, children: action.payload };
    case 'ADD_CHILD':
      return {
        ...state,
        children: [...state.children, action.payload],
        activeChild: action.payload,
      };
    case 'SET_ACTIVE_CHILD':
      return { ...state, activeChild: action.payload };
    case 'SET_ONBOARDED':
      return { ...state, isOnboarded: action.payload };
    case 'TOGGLE_DARK_MODE': {
      const next = !state.darkMode;
      if (next) {
        document.documentElement.classList.add('dark');
        document.body.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
        document.body.classList.remove('dark');
      }
      return { ...state, darkMode: next };
    }
    case 'SET_TODAY_QUESTIONS':
      return { ...state, todayQuestions: action.payload };
    case 'SET_TODAY_SESSION':
      return { ...state, todaySession: action.payload };
    case 'SET_STREAK':
      return { ...state, streak: action.payload };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    async function bootstrap() {
      try {
        const parent = await getParent();
        if (parent) {
          dispatch({ type: 'SET_PARENT', payload: parent });
          dispatch({ type: 'SET_ONBOARDED', payload: true });

          if (parent.settings.darkMode) {
            dispatch({ type: 'TOGGLE_DARK_MODE' });
          }

          const kids = await getChildren(parent.id);
          dispatch({ type: 'SET_CHILDREN', payload: kids });

          if (kids.length > 0) {
            dispatch({ type: 'SET_ACTIVE_CHILD', payload: kids[0] });
            const streak = await getStreak(kids[0].id);
            dispatch({ type: 'SET_STREAK', payload: streak ?? null });
          }
        }
      } finally {
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    }
    void bootstrap();
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}
