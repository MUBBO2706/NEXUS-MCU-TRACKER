import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { MCU_TITLES, MCU_QUOTES, MCU_TRIVIA } from './data/mcuData';
import { UserWatchData, McuTitle } from './types';
import { DetailModal } from './components/DetailModal';
import { AuthGateway } from './components/AuthGateway';
import {
  initCache,
  startPreCaching,
  clearCache,
  subscribeToCacheProgress,
  CacheProgress
} from './lib/assetCache';
import {
  LayoutDashboard,
  Film,
  Tv,
  Calendar,
  Users,
  TrendingUp,
  User,
  Info,
  CheckCircle2,
  AlertCircle,
  KeyRound,
  LogOut,
  Eye,
  EyeOff,
  Settings
} from 'lucide-react';

// Import Feature Tab Components
import { DashboardTab } from './components/Dashboard/DashboardTab';
import { MoviesTab } from './components/Movies/MoviesTab';
import { SeriesTab } from './components/Series/SeriesTab';
import { TimelineTab } from './components/Timeline/TimelineTab';
import { CharactersTab } from './components/Characters/CharactersTab';
import { AnalyticsTab } from './components/Analytics/AnalyticsTab';
import { ProfileTab } from './components/Profile/ProfileTab';
import { SettingsTab } from './components/Settings/SettingsTab';

// Import Custom Utilities and Hooks
import { formatToIndianDateTime } from './utils/date';
import { triggerConfettiParticles } from './utils/confetti';
import { useCountdown } from './hooks/useCountdown';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'movies' | 'series' | 'timeline' | 'characters' | 'analytics' | 'profile' | 'settings'>('dashboard');

  // Session Registry Page States
  const [showAllSessions, setShowAllSessions] = useState<boolean>(false);
  const [sessionSearchQuery, setSessionSearchQuery] = useState('');
  const [sessionFilterStatus, setSessionFilterStatus] = useState<'all' | 'Active' | 'Logged Out' | 'Expired'>('all');
  const [sessionPage, setSessionPage] = useState(1);

  // Authentication & Session States
  const [user, setUser] = useState<any | null>(null);
  const [authToken, setAuthToken] = useState<string | null>(localStorage.getItem('mcu_auth_token'));
  const [isAuthenticating, setIsAuthenticating] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [isOfflineSandbox, setIsOfflineSandbox] = useState<boolean>(false);
  const [telegramConfigured, setTelegramConfigured] = useState<boolean | null>(null);

  const [avatarUrl, setAvatarUrl] = useState<string>('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState<boolean>(false);
  const [isLoggingOut, setIsLoggingOut] = useState<boolean>(false);

  // Check Backend configuration on mount and validate session if token exists
  useEffect(() => {
    const initAuth = async () => {
      try {
        // 1. Check configuration
        const statusRes = await fetch('/api/auth/status');
        const statusText = await statusRes.text();
        let statusData;
        try {
          statusData = JSON.parse(statusText);
        } catch (e) {
          console.warn('Backend status response not JSON:', statusText);
          statusData = { configured: false };
        }
        setTelegramConfigured(!!statusData.configured);

        // 2. Validate token if present
        if (authToken) {
          const verifyRes = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${authToken}`,
            }
          });
          if (verifyRes.ok) {
            const verifyText = await verifyRes.text();
            let verifyData;
            try {
              verifyData = JSON.parse(verifyText);
            } catch (e) {
              console.warn('Backend auth/me response not JSON:', verifyText);
              handleLogoutQuietly();
              return;
            }
            if (verifyData.success && verifyData.user) {
              setUser(verifyData.user);
              setIsOfflineSandbox(false);

              // Load synchronized user state from Telegram database
              if (verifyData.user.watchData) {
                setWatchData(verifyData.user.watchData);
              }
              if (verifyData.user.unlockedAchievements) {
                setUnlockedAchievements(verifyData.user.unlockedAchievements);
              }
              if (verifyData.user.preferences) {
                const prefs = verifyData.user.preferences;
                if (prefs.theme) setActiveTheme(prefs.theme);
                if (prefs.favPhase) setFavoritePhase(prefs.favPhase);
                if (prefs.favChar) setFavoriteCharacter(prefs.favChar);
                if (prefs.devMode !== undefined) setDeveloperMode(prefs.devMode);
                if (prefs.orderingMode) {
                  setOrderingMode(prefs.orderingMode);
                  setTimelineMode(prefs.orderingMode === 'chronological' ? 'timeline' : 'release');
                }
              }
              if (verifyData.user.avatarUrl) {
                setAvatarUrl(verifyData.user.avatarUrl);
              }
            } else {
              handleLogoutQuietly();
            }
          } else {
            handleLogoutQuietly();
          }
        }
      } catch (err) {
        console.warn('Backend status/auth check failed:', err);
      } finally {
        setIsAuthenticating(false);
      }
    };
    initAuth();
  }, [authToken]);

  const handleLogoutQuietly = () => {
    localStorage.removeItem('mcu_auth_token');
    setAuthToken(null);
    setUser(null);
    setAvatarUrl('');
  };

  const handleLogout = async () => {
    if (isLoggingOut) return;
    setIsLoggingOut(true);
    try {
      if (authToken) {
        const res = await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        if (res.ok) {
          showFeedback('Session terminated successfully.', 'success');
        } else {
          showFeedback('Session terminated.', 'info');
        }
      } else {
        showFeedback('Session terminated.', 'info');
      }
    } catch (err) {
      console.warn('Logout signal to backend failed:', err);
      showFeedback('Session closed locally.', 'info');
    } finally {
      localStorage.removeItem('mcu_auth_token');
      setAuthToken(null);
      setUser(null);
      setAvatarUrl('');
      setIsLoggingOut(false);
      setActiveTab('dashboard');
    }
  };

  const handleLogin = async (usernameInput: string, passwordInput: string) => {
    if (!usernameInput || !passwordInput) {
      setAuthError('Username and password are required.');
      return;
    }
    setAuthError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: usernameInput, password: passwordInput }),
      });
      
      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Non-JSON login response:", responseText);
        setAuthError(`Server error (${res.status}): Please check backend configuration or logs.`);
        return;
      }

      if (res.ok && data.success) {
        localStorage.setItem('mcu_auth_token', data.token);
        setAuthToken(data.token);
        setUser(data.user);
        setIsOfflineSandbox(false);

        // Load synchronized user state from Telegram database
        if (data.user.watchData) {
          setWatchData(data.user.watchData);
        }
        if (data.user.unlockedAchievements) {
          setUnlockedAchievements(data.user.unlockedAchievements);
        }
        if (data.user.preferences) {
          const prefs = data.user.preferences;
          if (prefs.theme) setActiveTheme(prefs.theme);
          if (prefs.favPhase) setFavoritePhase(prefs.favPhase);
          if (prefs.favChar) setFavoriteCharacter(prefs.favChar);
          if (prefs.devMode !== undefined) setDeveloperMode(prefs.devMode);
          if (prefs.orderingMode) {
            setOrderingMode(prefs.orderingMode);
            setTimelineMode(prefs.orderingMode === 'chronological' ? 'timeline' : 'release');
          }
        }
        if (data.user.avatarUrl) {
          setAvatarUrl(data.user.avatarUrl);
        }

        showFeedback(`Welcome back, Agent ${data.user.username}!`, 'success');
      } else {
        setAuthError(data.error || 'Authentication failed. Please check credentials.');
      }
    } catch (err: any) {
      console.error("Login connection error:", err);
      setAuthError(`Unable to contact the authorization server: ${err.message || 'Please try again.'}`);
    }
  };

  const handleRegister = async (fullNameInput: string, usernameInput: string, passwordInput: string) => {
    if (!fullNameInput || !usernameInput || !passwordInput) {
      setAuthError('Full Name, Username, and password are required.');
      return;
    }
    if (fullNameInput.trim().length < 2) {
      setAuthError('Full Name must be at least 2 characters.');
      return;
    }
    if (usernameInput.trim().length < 3) {
      setAuthError('Username must be at least 3 characters.');
      return;
    }
    if (passwordInput.length < 4) {
      setAuthError('Password must be at least 4 characters.');
      return;
    }
    setAuthError(null);
    try {
      // Gather current anonymous session data for migration to Telegram backend storage
      const initialData = {
        watchData,
        unlockedAchievements,
        preferences: {
          theme: activeTheme,
          favPhase: favoritePhase,
          favChar: favoriteCharacter,
          devMode: developerMode,
        }
      };

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: fullNameInput,
          username: usernameInput,
          password: passwordInput,
          initialData
        }),
      });

      const responseText = await res.text();
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (e) {
        console.error("Non-JSON register response:", responseText);
        setAuthError(`Server error (${res.status}): Please check backend configuration or logs.`);
        return;
      }

      if (res.ok && data.success) {
        localStorage.setItem('mcu_auth_token', data.token);
        setAuthToken(data.token);
        setUser(data.user);
        setIsOfflineSandbox(false);

        // Delete raw local storage anonymous session variables since they have been migrated
        localStorage.removeItem('mcu_tracker_watch_data');
        localStorage.removeItem('mcu_unlocked_achievements');
        localStorage.removeItem('mcu_tracker_preferences');

        if (data.user.watchData) {
          setWatchData(data.user.watchData);
        }
        if (data.user.unlockedAchievements) {
          setUnlockedAchievements(data.user.unlockedAchievements);
        }
        if (data.user.preferences) {
          const prefs = data.user.preferences;
          if (prefs.theme) setActiveTheme(prefs.theme);
          if (prefs.favPhase) setFavoritePhase(prefs.favPhase);
          if (prefs.favChar) setFavoriteCharacter(prefs.favChar);
          if (prefs.devMode !== undefined) setDeveloperMode(prefs.devMode);
          if (prefs.orderingMode) {
            setOrderingMode(prefs.orderingMode);
            setTimelineMode(prefs.orderingMode === 'chronological' ? 'timeline' : 'release');
          }
        }
        if (data.user.avatarUrl) {
          setAvatarUrl(data.user.avatarUrl);
        }

        showFeedback(`Clearance granted. Welcome Agent ${data.user.username}!`, 'success');
      } else {
        setAuthError(data.error || 'Registration failed.');
      }
    } catch (err: any) {
      console.error("Register connection error:", err);
      setAuthError(`Unable to contact the registration server: ${err.message || 'Please try again.'}`);
    }
  };

  const handleOfflineSandboxBypass = () => {
    setIsOfflineSandbox(true);
    showFeedback('Sandbox Mode Activated.', 'info');
  };

  // Feedback Alerts (Toasts)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const showFeedback = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  // Watch data store
  const [watchData, setWatchData] = useState<Record<string, UserWatchData>>({});
  const [unlockedAchievements, setUnlockedAchievements] = useState<string[]>([]);

  // Client-side caching states
  const [cacheProgress, setCacheProgress] = useState<CacheProgress>({
    total: 0,
    completed: 0,
    failed: 0,
    isSyncing: false,
    isComplete: false,
  });

  // Initialize Cache and pre-caching routines
  useEffect(() => {
    const runCacheSync = async () => {
      await initCache();
      // Start caching all required external assets silently in the background
      startPreCaching();
    };
    runCacheSync();

    // Subscribe to Cache progress updates
    const unsubscribe = subscribeToCacheProgress((progress) => {
      setCacheProgress(progress);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Selection for Detail Modal
  const [selectedMovieId, setSelectedMovieId] = useState<string | null>(null);

  // Search & Filters state
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filterSaga, setFilterSaga] = useState<'all' | 'Infinity Saga' | 'Multiverse Saga' | 'Future Saga'>('all');
  const [filterPhase, setFilterPhase] = useState<'all' | number>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'watched' | 'unwatched' | 'later'>('all');
  const [filterLanguage, setFilterLanguage] = useState<'all' | 'Hindi'>('all');
  const [filterCharacter, setFilterCharacter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'release' | 'timeline' | 'rating'>('release');

  // Profile preferences
  const [activeTheme, setActiveTheme] = useState<'oled' | 'cosmic' | 'asgardian' | 'wakanda' | 'stark' | 'hydra'>('oled');
  const [favoritePhase, setFavoritePhase] = useState('');
  const [favoriteCharacter, setFavoriteCharacter] = useState('');
  const [orderingMode, setOrderingMode] = useState<'theatrical' | 'chronological'>('theatrical');
  const [developerMode, setDeveloperMode] = useState(false);
  const [stanLeeTapCount, setStanLeeTapCount] = useState(0);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);

  // Form input states for Account Control Room
  const [newFullName, setNewFullName] = useState('');
  const [newUsername, setNewUsername] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deletePassword, setDeletePassword] = useState('');

  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isResettingPassword, setIsResettingPassword] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [isEditingProfileInPlace, setIsEditingProfileInPlace] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [restoreProgress, setRestoreProgress] = useState('');

  // Password visibility states
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  // Trivia interaction
  const [currentTriviaIndex, setCurrentTriviaIndex] = useState(0);
  const [selectedAnswerIndex, setSelectedAnswerIndex] = useState<number | null>(null);
  const [showTriviaExplanation, setShowTriviaExplanation] = useState(false);

  // Dynamic values
  const [quoteOfTheDay, setQuoteOfTheDay] = useState({ text: '', character: '', title: '' });

  // Countdown hook
  const countdownString = useCountdown('2027-05-07T00:00:00');

  // Timeline mode (release order vs chronological timeline order)
  const [timelineMode, setTimelineMode] = useState<'timeline' | 'release'>('release');

  // Updates History Page States
  const [showAllUpdates, setShowAllUpdates] = useState<boolean>(false);
  const [updatesSearchQuery, setUpdatesSearchQuery] = useState('');
  const [updatesFilterCategory, setUpdatesFilterCategory] = useState<string>('all');
  const [updatesSortOrder, setUpdatesSortOrder] = useState<'newest' | 'oldest' | 'action-asc' | 'action-desc'>('newest');
  const [updatesFilterStartDate, setUpdatesFilterStartDate] = useState('');
  const [updatesFilterEndDate, setUpdatesFilterEndDate] = useState('');
  const [updatesPage, setUpdatesPage] = useState(1);

  const [sandboxUpdates, setSandboxUpdates] = useState<any[]>([]);

  // Load sandbox updates on mount/offline change
  useEffect(() => {
    try {
      const savedUpdates = localStorage.getItem('mcu_updates_history');
      if (savedUpdates) {
        setSandboxUpdates(JSON.parse(savedUpdates));
      } else if (isOfflineSandbox) {
        const initialSandboxUpdate = {
          id: 'sandbox-initial',
          timestamp: Date.now(),
          action: 'Account Created',
          previousValue: 'N/A',
          newValue: 'Sandbox session successfully initialized',
          source: 'Account',
          userPerformed: 'sandbox_agent',
          metadata: {}
        };
        setSandboxUpdates([initialSandboxUpdate]);
        localStorage.setItem('mcu_updates_history', JSON.stringify([initialSandboxUpdate]));
      }
    } catch (e) {
      console.error('LocalStorage load for updates failed', e);
    }
  }, [isOfflineSandbox]);

  const logSandboxUpdate = (action: string, previousValue: string, newValue: string, source: string, metadata?: any) => {
    setSandboxUpdates((prev) => {
      const newLog = {
        id: crypto.randomUUID ? crypto.randomUUID() : String(Math.random()),
        timestamp: Date.now(),
        action,
        previousValue,
        newValue,
        source,
        userPerformed: 'sandbox_agent',
        metadata: metadata || {}
      };
      const updated = [newLog, ...prev].slice(0, 500);
      localStorage.setItem('mcu_updates_history', JSON.stringify(updated));
      return updated;
    });
  };

  // Sync, Preferences and Avatar helpers
  const syncWithBackend = async (
    newWatchData?: Record<string, UserWatchData>,
    newAchievements?: string[],
    newPrefs?: {
      theme?: string;
      favPhase?: string;
      favChar?: string;
      devMode?: boolean;
      orderingMode?: 'theatrical' | 'chronological';
    },
    newAvatarUrl?: string
  ) => {
    if (!authToken || isOfflineSandbox) return;
    try {
      const body: any = {};
      if (newWatchData !== undefined) body.watchData = newWatchData;
      if (newAchievements !== undefined) body.unlockedAchievements = newAchievements;
      if (newPrefs !== undefined) body.preferences = newPrefs;
      if (newAvatarUrl !== undefined) body.avatarUrl = newAvatarUrl;

      const res = await fetch('/api/user/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        if (data.user) {
          setUser(data.user);
        }
      }
    } catch (err) {
      console.warn('Network sync with Telegram failed:', err);
    }
  };

  const updatePreference = (key: string, value: any) => {
    const nextPrefs = {
      theme: key === 'theme' ? value : activeTheme,
      favPhase: key === 'favPhase' ? value : favoritePhase,
      favChar: key === 'favChar' ? value : favoriteCharacter,
      devMode: key === 'devMode' ? value : developerMode,
      orderingMode: key === 'orderingMode' ? value : orderingMode,
    };

    if (key === 'theme') {
      setActiveTheme(value);
      if (isOfflineSandbox) {
        logSandboxUpdate("Theme changed", activeTheme.toUpperCase(), value.toUpperCase(), "Theme", { key });
      }
    }
    if (key === 'favPhase') {
      setFavoritePhase(value);
      if (isOfflineSandbox) {
        logSandboxUpdate("Favorite Phase changed", favoritePhase || "None", value || "None", "Profile", { key });
      }
    }
    if (key === 'favChar') {
      setFavoriteCharacter(value);
      if (isOfflineSandbox) {
        logSandboxUpdate("Favorite Character changed", favoriteCharacter || "None", value || "None", "Profile", { key });
      }
    }
    if (key === 'devMode') {
      setDeveloperMode(value);
      if (isOfflineSandbox) {
        logSandboxUpdate("Developer Mode toggled", String(developerMode), String(value), "Settings", { key });
      }
    }
    if (key === 'orderingMode') {
      setOrderingMode(value);
      setTimelineMode(value === 'chronological' ? 'timeline' : 'release');
      if (isOfflineSandbox) {
        logSandboxUpdate("Ordering Mode changed", orderingMode, value, "Settings", { key });
      }
    }

    if (isOfflineSandbox) {
      localStorage.setItem('mcu_tracker_preferences', JSON.stringify(nextPrefs));
    } else if (authToken) {
      syncWithBackend(undefined, undefined, nextPrefs);
    }
  };

  const handleSetUnlockedAchievements = (
    next: string[] | ((prev: string[]) => string[])
  ) => {
    setUnlockedAchievements((prev) => {
      const resolved = typeof next === 'function' ? next(prev) : next;
      if (isOfflineSandbox) {
        localStorage.setItem('mcu_unlocked_achievements', JSON.stringify(resolved));
        const added = resolved.filter(id => !prev.includes(id));
        const removed = prev.filter(id => !resolved.includes(id));
        if (added.length > 0) {
          added.forEach(id => {
            logSandboxUpdate("Achievement Unlocked", "Locked", `Unlocked: ${id}`, "Achievements", { achievementId: id });
          });
        }
        if (removed.length > 0) {
          removed.forEach(id => {
            logSandboxUpdate("Achievement Relocked", "Unlocked", `Locked: ${id}`, "Achievements", { achievementId: id });
          });
        }
      } else if (authToken) {
        syncWithBackend(undefined, resolved, undefined);
      }
      return resolved;
    });
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!authToken) {
      showFeedback('Please log in or register to set custom profile photos.', 'error');
      return;
    }

    // Convert file to Base64
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Data = reader.result as string;
      setIsUploadingAvatar(true);
      try {
        const res = await fetch('/api/user/avatar', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            avatarData: base64Data,
            filename: file.name,
          }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setAvatarUrl(data.avatarUrl);
          if (user) {
            setUser((prev: any) => prev ? { ...prev, avatarUrl: data.avatarUrl } : null);
          }
          showFeedback('Profile photo updated successfully!', 'success');
        } else {
          showFeedback(data.error || 'Failed to update profile photo.', 'error');
        }
      } catch (err) {
        showFeedback('Network error uploading avatar.', 'error');
      } finally {
        setIsUploadingAvatar(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFullName && !newUsername) {
      showFeedback('Full Name or Username must be provided to update profile.', 'error');
      return;
    }
    if (newUsername && newUsername.trim().length < 3) {
      showFeedback('Username must be at least 3 characters.', 'error');
      return;
    }
    if (newFullName && newFullName.trim().length < 2) {
      showFeedback('Full Name must be at least 2 characters.', 'error');
      return;
    }

    setIsUpdatingProfile(true);
    try {
      const res = await fetch('/api/user/update-profile', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({
          fullName: newFullName || undefined,
          username: newUsername || undefined,
        })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setUser(data.user);
        setNewFullName('');
        setNewUsername('');
        setIsEditingProfileInPlace(false);
        showFeedback('Agent Profile details updated successfully!', 'success');
      } else {
        showFeedback(data.error || 'Failed to update profile.', 'error');
      }
    } catch (err) {
      showFeedback('Network error updating profile details.', 'error');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleResetPasswordForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword) {
      showFeedback('Current password and new password are required.', 'error');
      return;
    }
    if (newPassword.length < 4) {
      showFeedback('New password must be at least 4 characters.', 'error');
      return;
    }

    setIsResettingPassword(true);
    try {
      const res = await fetch('/api/user/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ currentPassword, newPassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCurrentPassword('');
        setNewPassword('');
        setShowResetPasswordModal(false);
        showFeedback('Security credentials updated successfully!', 'success');
      } else {
        showFeedback(data.error || 'Failed to reset password.', 'error');
      }
    } catch (err) {
      showFeedback('Network error updating password.', 'error');
    } finally {
      setIsResettingPassword(false);
    }
  };

  const handleDeleteAccountForm = async () => {
    if (!deletePassword) {
      showFeedback('Please enter your password to decommission account.', 'error');
      return;
    }

    setIsDeletingAccount(true);
    try {
      const res = await fetch('/api/user/delete-account', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify({ password: deletePassword })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showFeedback('Agent profile decommissioned. Goodbye.', 'info');
        localStorage.removeItem('mcu_auth_token');
        setAuthToken(null);
        setUser(null);
        setAvatarUrl('');
        setDeletePassword('');
        setShowDeleteAccountModal(false);
        setActiveTab('dashboard');
      } else {
        showFeedback(data.error || 'Failed to decommission account.', 'error');
      }
    } catch (err) {
      showFeedback('Network error decommissioning account.', 'error');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  // Load from LocalStorage
  useEffect(() => {
    if (localStorage.getItem('mcu_auth_token')) return;

    try {
      const savedWatch = localStorage.getItem('mcu_tracker_watch_data');
      if (savedWatch) {
        setWatchData(JSON.parse(savedWatch));
      }
      const savedAchievements = localStorage.getItem('mcu_unlocked_achievements');
      if (savedAchievements) {
        setUnlockedAchievements(JSON.parse(savedAchievements));
      }
      const savedPrefs = localStorage.getItem('mcu_tracker_preferences');
      if (savedPrefs) {
        const parsed = JSON.parse(savedPrefs);
        if (parsed.theme) setActiveTheme(parsed.theme);
        if (parsed.favPhase) setFavoritePhase(parsed.favPhase);
        if (parsed.favChar) setFavoriteCharacter(parsed.favChar);
        if (parsed.devMode) setDeveloperMode(parsed.devMode);
        if (parsed.orderingMode) {
          setOrderingMode(parsed.orderingMode);
          setTimelineMode(parsed.orderingMode === 'chronological' ? 'timeline' : 'release');
        }
      }
    } catch (e) {
      console.error('LocalStorage load failed', e);
    }

    // Set daily quote based on current date
    const day = new Date().getDate();
    const quote = MCU_QUOTES[day % MCU_QUOTES.length];
    setQuoteOfTheDay(quote);

    // Initial trivia selection
    setCurrentTriviaIndex(day % MCU_TRIVIA.length);
  }, []);

  // Sync preferences to LocalStorage
  useEffect(() => {
    if (!isOfflineSandbox) return;
    localStorage.setItem(
      'mcu_tracker_preferences',
      JSON.stringify({
        theme: activeTheme,
        favPhase: favoritePhase,
        favChar: favoriteCharacter,
        devMode: developerMode,
        orderingMode: orderingMode,
      })
    );
  }, [activeTheme, favoritePhase, favoriteCharacter, developerMode, orderingMode, isOfflineSandbox]);

  // Update watch data for a movie
  const handleUpdateWatchData = (movieId: string, data: Partial<UserWatchData>) => {
    const prev = watchData[movieId] || {
      status: 'unwatched',
      rating: 0,
      favorite: false,
      notes: '',
      customTags: [],
    };
    const updated = { ...prev, ...data };
    const nextWatchData = { ...watchData, [movieId]: updated };
    setWatchData(nextWatchData);

    const fullTitle = MCU_TITLES.find(m => m.id === movieId)?.title || 'Title';

    if (isOfflineSandbox) {
      localStorage.setItem('mcu_tracker_watch_data', JSON.stringify(nextWatchData));
      if (data.status && data.status !== prev.status) {
        logSandboxUpdate(`Watch Status: ${fullTitle}`, prev.status.toUpperCase(), data.status.toUpperCase(), "Watch Status", { movieId });
      } else if (data.rating !== undefined && data.rating !== prev.rating) {
        logSandboxUpdate(`Rating: ${fullTitle}`, prev.rating ? `${prev.rating}★` : "No rating", `${data.rating}★`, "Watch Status", { movieId });
      } else if (data.favorite !== undefined && data.favorite !== prev.favorite) {
        logSandboxUpdate(`Favorite Status: ${fullTitle}`, prev.favorite ? "Favorited" : "Not Favorited", data.favorite ? "Favorited" : "Not Favorited", "Watch Status", { movieId });
      } else if (data.notes !== undefined && data.notes !== prev.notes) {
        logSandboxUpdate(`Watch Notes: ${fullTitle}`, prev.notes || "No notes", data.notes || "No notes", "Watch Status", { movieId });
      }
    } else if (authToken) {
      syncWithBackend(nextWatchData, undefined, undefined);
    }

    // Success feedback toasts for user watch-tracking events
    const title = fullTitle.length > 18 ? fullTitle.slice(0, 15) + '...' : fullTitle;
    if (data.status && data.status !== prev.status) {
      showFeedback(`"${title}": ${data.status.toUpperCase()}`, 'success');
    } else if (data.rating !== undefined && data.rating !== prev.rating) {
      showFeedback(`Rated "${title}" ${data.rating}★`, 'success');
    } else if (data.favorite !== undefined && data.favorite !== prev.favorite) {
      showFeedback(data.favorite ? `"${title}" favorited` : `"${title}" unfavorited`, 'info');
    } else {
      showFeedback(`Intel saved: "${title}"`, 'success');
    }
  };

  // Easter egg: Stan Lee count
  const handleStanLeeTap = () => {
    const count = stanLeeTapCount + 1;
    setStanLeeTapCount(count);
    if (count >= 5) {
      setDeveloperMode(true);
      triggerConfettiParticles();
      showFeedback('Developer Mode active!', 'success');
      setStanLeeTapCount(0);
    }
  };

  // JSON Export / Import
  const handleExportData = () => {
    const state = {
      watchData,
      unlockedAchievements,
      preferences: {
        theme: activeTheme,
        favPhase: favoritePhase,
        favChar: favoriteCharacter,
      },
    };
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcu_companion_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (isRestoring) return; // Prevent duplicate restore operations

    setIsRestoring(true);
    setRestoreProgress('Reading backup...');

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setRestoreProgress('Decrypting data...');
        const content = event.target?.result as string;
        if (!content) {
          throw new Error('S.H.I.E.L.D. archive file is empty.');
        }

        const parsed = JSON.parse(content);

        // Validation checks
        if (!parsed || typeof parsed !== 'object') {
          throw new Error('File structure is corrupt or invalid.');
        }

        const hasWatchData = parsed.watchData && typeof parsed.watchData === 'object';
        const hasAchievements = Array.isArray(parsed.unlockedAchievements);
        const hasPreferences = parsed.preferences && typeof parsed.preferences === 'object';

        if (!hasWatchData && !hasAchievements && !hasPreferences) {
          throw new Error('Invalid backup: missing watch data, achievements, or preference indices.');
        }

        setRestoreProgress('Reconstructing timeline...');
        
        let restoredWatchCount = 0;
        let restoredAchievementsCount = 0;

        // Apply state updates locally
        if (hasWatchData) {
          restoredWatchCount = Object.keys(parsed.watchData).length;
          setWatchData(parsed.watchData);
          localStorage.setItem('mcu_tracker_watch_data', JSON.stringify(parsed.watchData));
        }
        if (hasAchievements) {
          restoredAchievementsCount = parsed.unlockedAchievements.length;
          setUnlockedAchievements(parsed.unlockedAchievements);
          localStorage.setItem('mcu_unlocked_achievements', JSON.stringify(parsed.unlockedAchievements));
        }
        if (hasPreferences) {
          if (parsed.preferences.theme) {
            setActiveTheme(parsed.preferences.theme);
          }
          if (parsed.preferences.favPhase) {
            setFavoritePhase(parsed.preferences.favPhase);
          }
          if (parsed.preferences.favChar) {
            setFavoriteCharacter(parsed.preferences.favChar);
          }
          if (parsed.preferences.devMode !== undefined) {
            setDeveloperMode(parsed.preferences.devMode);
          }
          if (parsed.preferences.orderingMode) {
            setOrderingMode(parsed.preferences.orderingMode);
            setTimelineMode(parsed.preferences.orderingMode === 'chronological' ? 'timeline' : 'release');
          }
          localStorage.setItem(
            'mcu_tracker_preferences',
            JSON.stringify({
              theme: parsed.preferences.theme || activeTheme,
              favPhase: parsed.preferences.favPhase || favoritePhase,
              favChar: parsed.preferences.favChar || favoriteCharacter,
              devMode: parsed.preferences.devMode !== undefined ? parsed.preferences.devMode : developerMode,
              orderingMode: parsed.preferences.orderingMode || orderingMode,
            })
          );
        }

        // If authenticated, synchronize all reconstructed data with the backend
        if (authToken && !isOfflineSandbox) {
          setRestoreProgress('Syncing with Private Cloud...');
          const body: any = {};
          if (hasWatchData) body.watchData = parsed.watchData;
          if (hasAchievements) body.unlockedAchievements = parsed.unlockedAchievements;
          if (hasPreferences) {
            body.preferences = {
              theme: parsed.preferences.theme || activeTheme,
              favPhase: parsed.preferences.favPhase || favoritePhase,
              favChar: parsed.preferences.favChar || favoriteCharacter,
              devMode: parsed.preferences.devMode !== undefined ? parsed.preferences.devMode : developerMode,
              orderingMode: parsed.preferences.orderingMode || orderingMode,
            };
          }
          body.isRestore = true;

          const res = await fetch('/api/user/update', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`,
            },
            body: JSON.stringify(body),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.error || 'Private cloud sync failed.');
          }

          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          }
        } else if (isOfflineSandbox) {
          logSandboxUpdate("Backup Restored", "Previous local sandbox data", "Restored successfully", "Settings", { restoredWatchCount, restoredAchievementsCount });
        }

        // Complete!
        setRestoreProgress('Finalizing...');
        setTimeout(() => {
          triggerConfettiParticles();
          showFeedback(
            `📦 Backup restored successfully! Reconstructed ${restoredWatchCount} titles and ${restoredAchievementsCount} achievements.`,
            'success'
          );
          setIsRestoring(false);
          setRestoreProgress('');
          // Clear file input value
          e.target.value = '';
        }, 850);

      } catch (err: any) {
        console.error('Backup restore failed:', err);
        showFeedback(`⚠️ Restore failed: ${err.message || 'Invalid backup archive format.'}`, 'error');
        setIsRestoring(false);
        setRestoreProgress('');
        e.target.value = '';
      }
    };

    reader.onerror = () => {
      showFeedback('⚠️ Failed to read S.H.I.E.L.D. backup file.', 'error');
      setIsRestoring(false);
      setRestoreProgress('');
      e.target.value = '';
    };

    reader.readAsText(file);
  };

  // Reset core progress
  const handleResetProgress = () => {
    if (confirm('⚠️ Warning: This will delete all of your completed watch history, rating metrics, notes, and achievements. Proceed?')) {
      localStorage.clear();
      setWatchData({});
      setUnlockedAchievements([]);
      setFavoritePhase('');
      setFavoriteCharacter('');
      setDeveloperMode(false);
      location.reload();
    }
  };

  // Filter computation for movies & series list
  const getFilteredTitles = (type: 'all' | 'movie' | 'series') => {
    let list = MCU_TITLES;

    // Apply type filter
    if (type !== 'all') {
      list = list.filter((m) => m.type === type);
    }

    // Apply Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (m) =>
          m.title.toLowerCase().includes(q) ||
          m.director.toLowerCase().includes(q) ||
          (m.creator && m.creator.toLowerCase().includes(q)) ||
          m.genres.some((g) => g.toLowerCase().includes(q)) ||
          m.villains.some((v) => v.toLowerCase().includes(q)) ||
          m.mainCharacters.some((c) => c.toLowerCase().includes(q))
      );
    }

    // Apply Saga Filter
    if (filterSaga !== 'all') {
      list = list.filter((m) => m.saga === filterSaga);
    }

    // Apply Phase Filter
    if (filterPhase !== 'all') {
      list = list.filter((m) => m.phase === Number(filterPhase));
    }

    // Apply Language Filter (e.g. Hindi dub)
    if (filterLanguage !== 'all') {
      list = list.filter((m) => m.languages.includes(filterLanguage));
    }

    // Apply Character Filter
    if (filterCharacter !== 'all') {
      list = list.filter((m) => m.mainCharacters.includes(filterCharacter));
    }

    // Apply Watch Status Filter
    if (filterStatus !== 'all') {
      list = list.filter((m) => {
        const watch = watchData[m.id];
        if (filterStatus === 'watched') return watch?.status === 'completed';
        if (filterStatus === 'unwatched') return !watch || watch?.status === 'unwatched';
        if (filterStatus === 'later') return watch?.status === 'later';
        return true;
      });
    }

    // Sorting Engine
    const sorted = [...list];
    if (sortBy === 'release') {
      sorted.sort((a, b) => a.releaseYear - b.releaseYear);
    } else if (sortBy === 'timeline') {
      sorted.sort((a, b) => a.timelineOrder - b.timelineOrder);
    } else if (sortBy === 'rating') {
      sorted.sort((a, b) => b.ratings.imdb - a.ratings.imdb);
    }

    return sorted;
  };

  // Recommendations calculation for dynamic recommendation engine
  const getNextRecommendation = () => {
    // Find the first uncompleted movie in theatrical release order
    const sortedRelease = [...MCU_TITLES].sort((a, b) => a.releaseYear - b.releaseYear);
    const next = sortedRelease.find((m) => {
      const watch = watchData[m.id];
      return !watch || (watch.status !== 'completed' && watch.status !== 'dropped');
    });
    return next || null;
  };

  const nextRecommendation = getNextRecommendation();

  // Completion stats for overall dashboard ring
  const completionPercentage =
    MCU_TITLES.length > 0
      ? (MCU_TITLES.filter((m) => watchData[m.id]?.status === 'completed').length / MCU_TITLES.length) * 100
      : 0;

  // Active theme visual presets
  const getThemeClass = () => {
    switch (activeTheme) {
      case 'cosmic':
        return 'from-purple-950 via-neutral-950 to-indigo-950 text-indigo-100';
      case 'asgardian':
        return 'from-amber-950/20 via-neutral-950 to-slate-950 text-amber-100';
      case 'wakanda':
        return 'from-slate-950 via-neutral-950 to-purple-950/45 text-purple-100';
      case 'stark':
        return 'from-neutral-950 via-slate-950 to-sky-950 text-sky-100';
      case 'hydra':
        return 'from-stone-950 via-neutral-950 to-red-950/40 text-red-100';
      default: // oled
        return 'from-neutral-950 via-black to-neutral-950 text-neutral-100';
    }
  };

  // Trivia validation check
  const handleAnswerTrivia = (idx: number) => {
    setSelectedAnswerIndex(idx);
    setShowTriviaExplanation(true);
  };

  const isUnlocked = !!user || isOfflineSandbox;

  if (isAuthenticating && !isUnlocked) {
    return (
      <div className="min-h-screen bg-black text-neutral-100 flex items-center justify-center p-4 font-sans" style={{ minHeight: '100dvh' }}>
        <div className="flex flex-col items-center gap-4 text-center animate-fadeIn">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 border-2 border-neutral-800 border-t-marvel rounded-full animate-spin" />
            <span className="font-display text-[9px] text-marvel font-black tracking-tighter italic select-none">
              MCU
            </span>
          </div>
          <span className="text-[10px] uppercase font-mono tracking-widest text-neutral-500 animate-pulse">
            Verifying Agent Credentials...
          </span>
        </div>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <AuthGateway
        authMode={authMode}
        setAuthMode={setAuthMode}
        authError={authError}
        setAuthError={setAuthError}
        telegramConfigured={telegramConfigured}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onBypass={handleOfflineSandboxBypass}
      />
    );
  }

  // Selected Movie detail lookup
  const selectedMovie = selectedMovieId ? MCU_TITLES.find((m) => m.id === selectedMovieId) || null : null;

  return (
    <div className={`min-h-screen bg-gradient-to-b ${getThemeClass()} theme-${activeTheme} flex flex-col relative overflow-x-hidden transition-all duration-500`} style={{ minHeight: '100dvh' }}>
      {/* S.H.I.E.L.D. Floating Logo Header */}
      <header className="fixed top-0 left-0 right-0 z-40 bg-black/85 backdrop-blur-md border-b border-neutral-900 px-4 py-3 md:py-3.5 flex items-center shadow-md h-14 md:h-16">
        <div className="w-full flex items-center justify-between gap-4">
          <button
            onClick={handleStanLeeTap}
            className="flex items-center gap-2 focus:outline-none flex-shrink-0"
          >
            <span className="font-display font-black text-lg tracking-tighter bg-marvel text-white px-2 py-0.5 rounded italic">
              MARVEL
            </span>
          </button>

          {/* Desktop Navigation Links (Responsive) */}
          <div className="hidden md:flex items-center gap-1.5">
            {[
              { tab: 'dashboard', label: 'Dash', icon: LayoutDashboard },
              { tab: 'movies', label: 'Movies', icon: Film },
              { tab: 'series', label: 'Series', icon: Tv },
              { tab: 'timeline', label: 'Timeline', icon: Calendar },
              { tab: 'characters', label: 'Codex', icon: Users },
              { tab: 'analytics', label: 'Stats', icon: TrendingUp },
              { tab: 'profile', label: 'Profile', icon: User },
            ].map((item) => {
              const isActive = activeTab === item.tab;
              const Icon = item.icon;
              return (
                <button
                  key={item.tab}
                  onClick={() => {
                    setSelectedMovieId(null);
                    setShowAllSessions(false);
                    setActiveTab(item.tab as any);
                  }}
                  className={`relative flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold tracking-tight transition-colors focus:outline-none cursor-pointer ${
                    isActive
                      ? 'text-marvel font-bold'
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                  {isActive && (
                    <span className="absolute bottom-0 left-3 right-3 h-[2px] bg-marvel rounded-full" />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex items-center gap-2.5 flex-shrink-0 relative">
            {/* Profile icon with dropdown menu */}
            <div className="relative">
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 transition-all focus:outline-none flex items-center justify-center cursor-pointer overflow-hidden"
                aria-label="Profile Menu"
              >
                {avatarUrl ? (
                  <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                ) : (
                  <User className="w-4 h-4 text-marvel" />
                )}
              </button>

              {/* Profile Dropdown */}
              {showProfileDropdown && (
                <>
                  {/* Backdrop overlay to close when clicking outside */}
                  <div
                    className="fixed inset-0 z-40 cursor-default"
                    onClick={() => setShowProfileDropdown(false)}
                  />
                  
                  <div className="absolute right-0 mt-2.5 w-56 bg-black/95 backdrop-blur-md border border-neutral-800 rounded-xl p-3 shadow-2xl z-50 flex flex-col gap-2.5 animate-fadeIn">
                    {/* Visual Callout/Tail pointing to profile button */}
                    <div className="absolute right-3.5 -top-1.5 w-3 h-3 rotate-45 bg-black border-l border-t border-neutral-800 z-10" />

                    {/* First Row: Avatar and Username */}
                    <div className="flex items-center gap-3 border-b border-neutral-900/60 pb-3 relative z-20">
                      <div className="w-9 h-9 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center text-marvel flex-shrink-0 overflow-hidden">
                        {avatarUrl ? (
                          <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          <User className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-white leading-none">{user?.username || (isOfflineSandbox ? "Sandbox Agent" : "Agent Carter")}</span>
                        <span className="text-[9px] font-mono text-neutral-500 mt-1 uppercase tracking-wider">{isOfflineSandbox ? "Sandbox Mode" : "Clearance lvl 7"}</span>
                      </div>
                    </div>

                    {/* Second Row: Reset Password action */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileDropdown(false);
                        if (authToken) {
                          setShowResetPasswordModal(true);
                        } else {
                          showFeedback('Reset password is only available for registered agents. Please register or login.', 'info');
                        }
                      }}
                      className="flex items-center gap-2.5 px-1 py-1.5 text-left text-xs font-sans font-semibold text-neutral-300 hover:text-white transition-colors focus:outline-none cursor-pointer bg-transparent border-0 w-full"
                    >
                      <KeyRound className="w-4 h-4 text-marvel" />
                      Change Password
                    </button>

                    {/* Settings Page Navigation Link */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileDropdown(false);
                        setSelectedMovieId(null);
                        setShowAllSessions(false);
                        setActiveTab('settings');
                      }}
                      className="flex items-center gap-2.5 px-1 py-1.5 text-left text-xs font-sans font-semibold text-neutral-300 hover:text-white transition-colors focus:outline-none cursor-pointer bg-transparent border-0 w-full"
                    >
                      <Settings className="w-4 h-4 text-marvel" />
                      Settings
                    </button>

                    {/* Third Row: Logout action */}
                    <button
                      type="button"
                      onClick={() => {
                        setShowProfileDropdown(false);
                        handleLogout();
                      }}
                      className="flex items-center gap-2.5 px-1 py-1.5 text-left text-xs font-sans font-semibold text-rose-500 hover:text-rose-400 transition-colors focus:outline-none cursor-pointer border-t border-neutral-900/60 bg-transparent border-0"
                    >
                      <LogOut className="w-4 h-4 text-rose-500" />
                      Terminate Session
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* CORE LAYOUT CANVAS */}
      <main className="flex-1 w-full px-4 md:px-6 pt-20 md:pt-24 pb-20 md:pb-8 flex flex-col items-center">
        <div className="w-full space-y-6 md:space-y-8">
          {selectedMovie ? (
            <DetailModal
              movie={selectedMovie}
              watchData={watchData}
              onClose={() => setSelectedMovieId(null)}
              onUpdateWatchData={handleUpdateWatchData}
              onSelectMovie={setSelectedMovieId}
            />
          ) : (
            <>
              {/* --- 1. TAB: DASHBOARD --- */}
              {activeTab === 'dashboard' && (
                <DashboardTab
                  watchData={watchData}
                  countdownString={countdownString}
                  completionPercentage={completionPercentage}
                  quoteOfTheDay={quoteOfTheDay}
                  nextRecommendation={nextRecommendation}
                  handleSelectMovieId={setSelectedMovieId}
                  orderingMode={orderingMode}
                />
              )}

              {/* --- 2. TAB: MOVIES --- */}
              {activeTab === 'movies' && (
                <MoviesTab
                  watchData={watchData}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  showFilters={showFilters}
                  setShowFilters={setShowFilters}
                  filterSaga={filterSaga}
                  setFilterSaga={setFilterSaga}
                  filterPhase={filterPhase}
                  setFilterPhase={setFilterPhase}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  filterLanguage={filterLanguage}
                  setFilterLanguage={setFilterLanguage}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  handleSelectMovieId={setSelectedMovieId}
                  activeTheme={activeTheme}
                  orderingMode={orderingMode}
                />
              )}

              {/* --- 3. TAB: SERIES --- */}
              {activeTab === 'series' && (
                <SeriesTab
                  watchData={watchData}
                  searchQuery={searchQuery}
                  setSearchQuery={setSearchQuery}
                  showFilters={showFilters}
                  setShowFilters={setShowFilters}
                  filterSaga={filterSaga}
                  setFilterSaga={setFilterSaga}
                  filterPhase={filterPhase}
                  setFilterPhase={setFilterPhase}
                  filterStatus={filterStatus}
                  setFilterStatus={setFilterStatus}
                  filterLanguage={filterLanguage}
                  setFilterLanguage={setFilterLanguage}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                  handleSelectMovieId={setSelectedMovieId}
                  activeTheme={activeTheme}
                  orderingMode={orderingMode}
                />
              )}

              {/* --- 4. TAB: TIMELINE --- */}
              {activeTab === 'timeline' && (
                <TimelineTab
                  watchData={watchData}
                  timelineMode={timelineMode}
                  setTimelineMode={(val) => {
                    setTimelineMode(val);
                    updatePreference('orderingMode', val === 'timeline' ? 'chronological' : 'theatrical');
                  }}
                  handleSelectMovieId={setSelectedMovieId}
                />
              )}

              {/* --- 5. TAB: CHARACTERS --- */}
              {activeTab === 'characters' && (
                <CharactersTab handleSelectMovieId={setSelectedMovieId} />
              )}

              {/* --- 6. TAB: ANALYTICS/STATS --- */}
              {activeTab === 'analytics' && (
                <AnalyticsTab
                  watchData={watchData}
                  favoritePhase={favoritePhase}
                  updatePreference={updatePreference}
                  favoriteCharacter={favoriteCharacter}
                  activeTheme={activeTheme}
                  unlockedAchievements={unlockedAchievements}
                  handleSetUnlockedAchievements={handleSetUnlockedAchievements}
                  triggerConfettiParticles={triggerConfettiParticles}
                  orderingMode={orderingMode}
                />
              )}

              {/* --- 7. TAB: PROFILE STATION --- */}
              {activeTab === 'profile' && (
                <ProfileTab
                  showAllSessions={showAllSessions}
                  setShowAllSessions={setShowAllSessions}
                  sessionSearchQuery={sessionSearchQuery}
                  setSessionSearchQuery={setSessionSearchQuery}
                  sessionFilterStatus={sessionFilterStatus}
                  setSessionFilterStatus={setSessionFilterStatus}
                  sessionPage={sessionPage}
                  setSessionPage={setSessionPage}
                  showAllUpdates={showAllUpdates}
                  setShowAllUpdates={setShowAllUpdates}
                  updatesSearchQuery={updatesSearchQuery}
                  setUpdatesSearchQuery={setUpdatesSearchQuery}
                  updatesFilterCategory={updatesFilterCategory}
                  setUpdatesFilterCategory={setUpdatesFilterCategory}
                  updatesSortOrder={updatesSortOrder}
                  setUpdatesSortOrder={setUpdatesSortOrder}
                  updatesFilterStartDate={updatesFilterStartDate}
                  setUpdatesFilterStartDate={setUpdatesFilterStartDate}
                  updatesFilterEndDate={updatesFilterEndDate}
                  setUpdatesFilterEndDate={setUpdatesFilterEndDate}
                  updatesPage={updatesPage}
                  setUpdatesPage={setUpdatesPage}
                  sandboxUpdates={sandboxUpdates}
                  user={user}
                  activeTheme={activeTheme}
                  updatePreference={updatePreference}
                  orderingMode={orderingMode}
                  authToken={authToken}
                  isOfflineSandbox={isOfflineSandbox}
                  avatarUrl={avatarUrl}
                  handleAvatarChange={handleAvatarChange}
                  isUploadingAvatar={isUploadingAvatar}
                  isEditingProfileInPlace={isEditingProfileInPlace}
                  setIsEditingProfileInPlace={setIsEditingProfileInPlace}
                  newFullName={newFullName}
                  setNewFullName={setNewFullName}
                  newUsername={newUsername}
                  setNewUsername={setNewUsername}
                  handleProfileUpdate={handleProfileUpdate}
                  isUpdatingProfile={isUpdatingProfile}
                  formatToIndianDateTime={formatToIndianDateTime}
                  setShowResetPasswordModal={setShowResetPasswordModal}
                  showFeedback={showFeedback}
                  handleExportData={handleExportData}
                  isRestoring={isRestoring}
                  restoreProgress={restoreProgress}
                  handleImportData={handleImportData}
                  cacheProgress={cacheProgress}
                  startPreCaching={startPreCaching}
                  clearCache={clearCache}
                  developerMode={developerMode}
                />
              )}

              {/* --- 8. TAB: SETTINGS STATION --- */}
              {activeTab === 'settings' && (
                <SettingsTab
                  activeTheme={activeTheme}
                  updatePreference={updatePreference}
                  orderingMode={orderingMode}
                  handleExportData={handleExportData}
                  isRestoring={isRestoring}
                  restoreProgress={restoreProgress}
                  handleImportData={handleImportData}
                  cacheProgress={cacheProgress}
                  startPreCaching={startPreCaching}
                  clearCache={clearCache}
                  developerMode={developerMode}
                  showFeedback={showFeedback}
                  authToken={authToken}
                  handleResetProgress={handleResetProgress}
                  setShowDeleteAccountModal={setShowDeleteAccountModal}
                />
              )}
            </>
          )}
        </div>
      </main>

      {/* STICKY BOTTOM NAVIGATION BAR FOR MOBILE-FIRST FLOW */}
      <nav className="fixed bottom-0 inset-x-0 bg-neutral-950 border-t border-neutral-900 py-2 px-3 z-30 shadow-2xl flex md:hidden items-center justify-between safe-bottom">
        {[
          { tab: 'dashboard', label: 'Dash', icon: LayoutDashboard },
          { tab: 'movies', label: 'Movies', icon: Film },
          { tab: 'series', label: 'Series', icon: Tv },
          { tab: 'timeline', label: 'Timeline', icon: Calendar },
          { tab: 'characters', label: 'Codex', icon: Users },
          { tab: 'analytics', label: 'Stats', icon: TrendingUp },
          { tab: 'profile', label: 'Profile', icon: User },
        ].map((item) => {
          const isActive = activeTab === item.tab;
          const Icon = item.icon;
          return (
            <button
              key={item.tab}
              onClick={() => {
                setSelectedMovieId(null);
                setShowAllSessions(false);
                setActiveTab(item.tab as any);
              }}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 py-1 transition-all focus:outline-none ${
                isActive
                  ? 'text-marvel active-nav-bubble font-semibold'
                  : 'text-neutral-500 hover:text-neutral-300'
              }`}
            >
              <Icon className={`w-4.5 h-4.5 ${isActive ? 'scale-110 drop-shadow-[0_0_4px_rgba(230,36,41,0.4)]' : ''}`} />
              {isActive && (
                <span className="text-[9px] font-bold tracking-tight font-display animate-fadeIn">
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Dynamic S.H.I.E.L.D. Alerts (Toast) */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -20, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, x: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, x: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 350, damping: 25 }}
            className="fixed top-[72px] md:top-[80px] right-6 z-50 pointer-events-none flex justify-end w-[calc(100vw-3rem)] sm:w-auto"
          >
            <div className={`p-2 pl-2.5 pr-4 rounded-xl border shadow-xl flex items-center gap-2.5 backdrop-blur-md overflow-hidden ${
              toast.type === 'success'
                ? 'bg-neutral-950/95 border-emerald-500/20 text-white'
                : toast.type === 'error'
                ? 'bg-rose-950/95 border-rose-500/20 text-white'
                : 'bg-neutral-950/95 border-neutral-800 text-white'
            }`}>
              <div className={`p-1 rounded-lg flex-shrink-0 ${
                toast.type === 'success' ? 'bg-emerald-500/10 text-emerald-400' :
                toast.type === 'error' ? 'bg-rose-500/10 text-rose-400' :
                'bg-sky-500/10 text-sky-400'
              }`}>
                {toast.type === 'success' && <CheckCircle2 className="w-3.5 h-3.5" />}
                {toast.type === 'error' && <AlertCircle className="w-3.5 h-3.5" />}
                {toast.type === 'info' && <Info className="w-3.5 h-3.5" />}
              </div>
              <span className="text-[11px] font-sans font-medium tracking-tight text-neutral-300 leading-tight pr-1">{toast.message}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Logout Fullscreen Overlay */}
      {isLoggingOut && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex flex-col items-center justify-center gap-4 animate-fadeIn">
          <div className="w-10 h-10 border-2 border-marvel/20 border-t-marvel rounded-full animate-spin" />
          <p className="font-display font-bold text-sm text-neutral-200 tracking-wider uppercase animate-pulse">Logging out of Secure Session...</p>
        </div>
      )}

      {/* Reset Password Modal */}
      <AnimatePresence>
        {showResetPasswordModal && (
          <div className="fixed inset-0 bg-black/96 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-neutral-950 border border-neutral-800 rounded-2xl p-5 w-full max-w-md shadow-2xl flex flex-col gap-4 relative text-left"
            >
              <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-white flex items-center gap-2">
                  <KeyRound className="w-4 h-4 text-marvel" />
                  Reset Security Credentials
                </h3>
                <button
                  onClick={() => {
                    setShowResetPasswordModal(false);
                    setCurrentPassword('');
                    setNewPassword('');
                    setShowCurrentPassword(false);
                    setShowNewPassword(false);
                  }}
                  className="text-neutral-500 hover:text-white transition-colors focus:outline-none cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              <form onSubmit={handleResetPasswordForm} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-neutral-400">Current Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showCurrentPassword ? "text" : "password"}
                      required
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-marvel rounded-lg pl-3.5 pr-10 py-2.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="absolute right-3 text-neutral-500 hover:text-neutral-300 focus:outline-none"
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[10px] uppercase font-mono font-bold text-neutral-400">New Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showNewPassword ? "text" : "password"}
                      required
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-marvel rounded-lg pl-3.5 pr-10 py-2.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-3 text-neutral-500 hover:text-neutral-300 focus:outline-none"
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <span className="text-[9px] text-neutral-500">Minimum 4 characters required.</span>
                </div>

                <div className="flex gap-3 mt-2 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowResetPasswordModal(false);
                      setCurrentPassword('');
                      setNewPassword('');
                      setShowCurrentPassword(false);
                      setShowNewPassword(false);
                    }}
                    className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isResettingPassword}
                    className="bg-marvel hover:bg-marvel/90 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isResettingPassword ? "Resetting..." : "Reset Password"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Delete Account Modal */}
      <AnimatePresence>
        {showDeleteAccountModal && (
          <div className="fixed inset-0 bg-black/96 backdrop-blur-md z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="bg-neutral-950 border border-red-950 rounded-2xl p-5 w-full max-w-md shadow-2xl flex flex-col gap-4 relative text-left"
            >
              <div className="flex items-center justify-between border-b border-red-950/40 pb-3">
                <h3 className="font-display font-bold text-sm uppercase tracking-wider text-rose-500 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-500" />
                  Delete Agent Profile
                </h3>
                <button
                  onClick={() => {
                    setShowDeleteAccountModal(false);
                    setDeletePassword('');
                    setShowDeletePassword(false);
                  }}
                  className="text-neutral-500 hover:text-white transition-colors focus:outline-none cursor-pointer text-sm"
                >
                  ✕
                </button>
              </div>

              <div className="flex flex-col gap-3">
                <p className="text-xs text-rose-200/90 leading-relaxed font-semibold bg-rose-500/5 p-3 rounded-xl border border-rose-500/10">
                  🚨 CRITICAL WARNING: Deleting your account is permanent. Your credentials and profile records will be wiped out from S.H.I.E.L.D. secure database. All your progress will be wiped out from the cloud.
                </p>

                <div className="flex flex-col gap-1.5 mt-2">
                  <label className="text-[10px] uppercase font-mono font-bold text-neutral-400">Confirm with Password</label>
                  <div className="relative flex items-center">
                    <input
                      type={showDeletePassword ? "text" : "password"}
                      required
                      value={deletePassword}
                      onChange={(e) => setDeletePassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-neutral-900 border border-neutral-800 focus:border-rose-500 rounded-lg pl-3.5 pr-10 py-2.5 text-xs text-white focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowDeletePassword(!showDeletePassword)}
                      className="absolute right-3 text-neutral-500 hover:text-neutral-300 focus:outline-none"
                    >
                      {showDeletePassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex gap-3 mt-3 justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteAccountModal(false);
                      setDeletePassword('');
                      setShowDeletePassword(false);
                    }}
                    className="bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteAccountForm}
                    disabled={isDeletingAccount}
                    className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-semibold text-xs px-4 py-2.5 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    {isDeletingAccount ? "Deleting..." : "Confirm Delete"}
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  );
}
