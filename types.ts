
export interface User {
  id: string;
  username: string;
  email: string;
}

export interface Note {
  id: string;
  userId: string;
  title: string;
  content: string;
  last_update: string;
  created_on: string;
}
