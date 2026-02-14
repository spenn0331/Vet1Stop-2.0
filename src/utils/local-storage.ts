/**
 * Local storage utility functions for persisting user interaction data.
 * These functions handle saving and retrieving data from browser localStorage
 * with proper error handling and type safety.
 */

// Saved questions by the user
export interface SavedQuestion {
  id: string;
  ngoId: string;
  ngoName: string;
  question: string;
  date: string;
  status: 'pending' | 'answered' | 'verified';
}

// Info requests made by the user
export interface InfoRequest {
  id: string;
  ngoId: string;
  ngoName: string;
  date: string;
  questions: string[];
  status: 'pending' | 'contacted' | 'resolved';
}

// Saved NGOs (like bookmarks)
export interface SavedNGO {
  id: string;
  name: string;
  category: string;
  date: string;
}

// User pathway progress
export interface PathwayProgress {
  pathwayId: string;
  title: string;
  currentStep: number;
  totalSteps: number;
  lastUpdated: string;
  completed: boolean;
}

// User preferences for the application
export interface UserPreferences {
  serviceBranch?: string;
  serviceStatus?: string;
  location?: string;
  interests?: string[];
  highContrast: boolean;
  notificationsEnabled: boolean;
}

// Storage keys enum to prevent typos
enum StorageKeys {
  SAVED_QUESTIONS = 'vet1stop_saved_questions',
  INFO_REQUESTS = 'vet1stop_info_requests',
  SAVED_NGOS = 'vet1stop_saved_ngos',
  PATHWAY_PROGRESS = 'vet1stop_pathway_progress',
  USER_PREFERENCES = 'vet1stop_user_preferences'
}

/**
 * Safely saves data to localStorage with error handling
 */
function saveToStorage<T>(key: StorageKeys, data: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error(`Failed to save to localStorage: ${key}`, error);
    return false;
  }
}

/**
 * Safely retrieves data from localStorage with error handling
 */
function getFromStorage<T>(key: StorageKeys, defaultValue: T): T {
  try {
    const storedData = localStorage.getItem(key);
    return storedData ? JSON.parse(storedData) : defaultValue;
  } catch (error) {
    console.error(`Failed to get from localStorage: ${key}`, error);
    return defaultValue;
  }
}

/**
 * Clears a specific item from localStorage
 */
function clearFromStorage(key: StorageKeys): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to clear from localStorage: ${key}`, error);
    return false;
  }
}

// Questions functions
export function getSavedQuestions(): SavedQuestion[] {
  return getFromStorage<SavedQuestion[]>(StorageKeys.SAVED_QUESTIONS, []);
}

export function saveQuestion(question: Omit<SavedQuestion, 'id' | 'date'>): string {
  const questions = getSavedQuestions();
  const id = `q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newQuestion: SavedQuestion = {
    id,
    ...question,
    date: new Date().toISOString(),
    status: 'pending'
  };
  
  questions.push(newQuestion);
  saveToStorage(StorageKeys.SAVED_QUESTIONS, questions);
  return id;
}

export function updateQuestionStatus(id: string, status: SavedQuestion['status']): boolean {
  const questions = getSavedQuestions();
  const index = questions.findIndex(q => q.id === id);
  
  if (index !== -1) {
    questions[index].status = status;
    return saveToStorage(StorageKeys.SAVED_QUESTIONS, questions);
  }
  return false;
}

// Info requests functions
export function getInfoRequests(): InfoRequest[] {
  return getFromStorage<InfoRequest[]>(StorageKeys.INFO_REQUESTS, []);
}

export function saveInfoRequest(request: Omit<InfoRequest, 'id' | 'date'>): string {
  const requests = getInfoRequests();
  const id = `ir-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
  const newRequest: InfoRequest = {
    id,
    ...request,
    date: new Date().toISOString(),
    status: 'pending'
  };
  
  requests.push(newRequest);
  saveToStorage(StorageKeys.INFO_REQUESTS, requests);
  return id;
}

export function updateInfoRequestStatus(id: string, status: InfoRequest['status']): boolean {
  const requests = getInfoRequests();
  const index = requests.findIndex(r => r.id === id);
  
  if (index !== -1) {
    requests[index].status = status;
    return saveToStorage(StorageKeys.INFO_REQUESTS, requests);
  }
  return false;
}

// Saved NGOs functions
export function getSavedNGOs(): SavedNGO[] {
  return getFromStorage<SavedNGO[]>(StorageKeys.SAVED_NGOS, []);
}

export function saveNGO(ngo: Omit<SavedNGO, 'date'>): boolean {
  const ngos = getSavedNGOs();
  
  // Check if already saved
  if (ngos.some(n => n.id === ngo.id)) {
    return true;
  }
  
  const newNGO: SavedNGO = {
    ...ngo,
    date: new Date().toISOString()
  };
  
  ngos.push(newNGO);
  return saveToStorage(StorageKeys.SAVED_NGOS, ngos);
}

export function removeNGO(id: string): boolean {
  const ngos = getSavedNGOs();
  const filteredNgos = ngos.filter(n => n.id !== id);
  return saveToStorage(StorageKeys.SAVED_NGOS, filteredNgos);
}

// Pathway progress functions
export function getPathwayProgress(): PathwayProgress[] {
  return getFromStorage<PathwayProgress[]>(StorageKeys.PATHWAY_PROGRESS, []);
}

export function updatePathwayProgress(progress: Omit<PathwayProgress, 'lastUpdated'>): boolean {
  const allProgress = getPathwayProgress();
  const index = allProgress.findIndex(p => p.pathwayId === progress.pathwayId);
  
  const updatedProgress: PathwayProgress = {
    ...progress,
    lastUpdated: new Date().toISOString()
  };
  
  if (index !== -1) {
    allProgress[index] = updatedProgress;
  } else {
    allProgress.push(updatedProgress);
  }
  
  return saveToStorage(StorageKeys.PATHWAY_PROGRESS, allProgress);
}

// User preferences functions
export function getUserPreferences(): UserPreferences {
  return getFromStorage<UserPreferences>(StorageKeys.USER_PREFERENCES, {
    highContrast: false,
    notificationsEnabled: true
  });
}

export function saveUserPreferences(preferences: UserPreferences): boolean {
  return saveToStorage(StorageKeys.USER_PREFERENCES, preferences);
}

// Check if localStorage is available in the environment
export function isLocalStorageAvailable(): boolean {
  try {
    const testKey = '__storage_test__';
    localStorage.setItem(testKey, testKey);
    localStorage.removeItem(testKey);
    return true;
  } catch (e) {
    return false;
  }
}
