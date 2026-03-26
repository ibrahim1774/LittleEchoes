import {
  createContext,
  useContext,
  useReducer,
  useEffect,
  type ReactNode,
} from 'react';
import type { AppState, AppAction } from '@/types';
import { getParent, getChildren, getStreak } from '@/services/storage';
import { supabase } from '@/services/supabase';

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
  user: null,
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
    case 'SET_USER':
      return { ...state, user: action.payload };
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
        // Check Supabase auth session — isolated so a failure here
        // doesn't prevent loading local data from IndexedDB
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            dispatch({ type: 'SET_USER', payload: { id: session.user.id, email: session.user.email ?? '' } });
          }
        } catch {
          // Auth check failed (expired token, network issue) — continue with local data
        }

        const parent = await getParent();
        if (parent) {
          dispatch({ type: 'SET_PARENT', payload: parent });
          dispatch({ type: 'SET_ONBOARDED', payload: true });

          if (parent.settings?.darkMode) {
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

    // Keep user in sync with Supabase auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      dispatch({
        type: 'SET_USER',
        payload: session?.user ? { id: session.user.id, email: session.user.email ?? '' } : null,
      });
    });
    return () => subscription.unsubscribe();
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
