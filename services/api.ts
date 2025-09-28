import type { User, Note } from '../types';

const API_URL = 'http://localhost:8000';

// --- HELPER FUNCTIONS ---
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  if (!token) return {};
  return {
    'Authorization': `Bearer ${token}`
  };
};

const handleResponse = async (response: Response) => {
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'An unknown error occurred.' }));
        throw new Error(errorData.detail || `HTTP error! status: ${response.status}`);
    }
    if (response.status === 204) { // No Content
        return;
    }
    return response.json();
};

// --- API FUNCTIONS ---
export const api = {
  signup: async (username: string, email: string, password: string): Promise<{ user: User; token: string }> => {
    const response = await fetch(`${API_URL}/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, email, password }),
    });
    await handleResponse(response);
    // After successful signup, log the user in to get a token
    return api.login(email, password);
  },

  login: async (email: string, password: string): Promise<{ user: User; token: string }> => {
    const formData = new URLSearchParams();
    formData.append('username', email);
    formData.append('password', password);

    const response = await fetch(`${API_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: formData.toString(),
    });
    const data = await handleResponse(response);
    const token = data.access_token;
    localStorage.setItem('token', token);

    // After getting the token, fetch user details
    const user = await api.getMe();
    localStorage.setItem('user', JSON.stringify(user));

    return { user, token };
  },

  getMe: async (): Promise<User> => {
    const response = await fetch(`${API_URL}/users/me`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    return handleResponse(response);
  },

  getNotesForUser: async (): Promise<Note[]> => {
    const response = await fetch(`${API_URL}/notes`, {
        method: 'GET',
        headers: getAuthHeaders(),
    });
    const notesData = await handleResponse(response);
    // The backend sends `NoteSchema`, we map it to the frontend `Note` type.
    return notesData.map((note: any) => ({
      ...note,
      // Ensure date strings are in ISO format if they aren't already
      last_update: new Date(note.last_update).toISOString(),
      created_on: new Date(note.created_on).toISOString(),
    }));
  },

  createNote: async (title: string, content: string): Promise<Note> => {
     const response = await fetch(`${API_URL}/notes`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({ title, content }),
    });
    return handleResponse(response);
  },

  updateNote: async (noteId: string, title: string, content: string): Promise<Note> => {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders()
        },
        body: JSON.stringify({ title, content }),
    });
    return handleResponse(response);
  },

  deleteNote: async (noteId: string): Promise<void> => {
    const response = await fetch(`${API_URL}/notes/${noteId}`, {
        method: 'DELETE',
        headers: getAuthHeaders(),
    });
    await handleResponse(response);
  }
};