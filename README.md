# Keep Notes - Full Stack Assignment

A modern, responsive note-taking web application built with React, FastAPI, and Tailwind CSS. It allows users to sign up, log in, and manage their personal notes through a clean and intuitive interface.

## 📸 Screenshots

*(It is highly recommended to add screenshots of your application here, for example: the login page and the main notes page.)*

**Login Page**
`![Login Page Screenshot](placeholder.png)`

**Notes Dashboard**
`![Notes Dashboard Screenshot](placeholder.png)`


## 🛠 Tech Stack

- **Frontend:** React, TypeScript, Tailwind CSS
- **Backend:** Python, FastAPI, SQLAlchemy
- **Database:** SQLite
- **Authentication:** JWT (JSON Web Tokens)

## ✨ Features

-   **User Authentication:** Secure user registration and login functionality.
-   **JWT-Powered Sessions:** Uses token-based authentication to protect user data.
-   **Full CRUD for Notes:** Users can create, read, update, and delete their own notes.
-   **Responsive Design:** A clean, mobile-first interface that works on all screen sizes.
-   **Intuitive UI:** A simple, Google Keep-inspired card layout for notes and a modal for editing.

## 🚀 How to Run Locally

### Prerequisites
- Python (3.8 or newer)
- Node.js and npm

### 1. Running the Backend (FastAPI Server)

1.  **Navigate to the Backend Directory:**
    ```bash
    cd backend
    ```

2.  **Create and Activate a Virtual Environment:**
    ```bash
    # Create the virtual environment
    python -m venv venv

    # Activate on Windows
    venv\Scripts\activate

    # Activate on macOS/Linux
    source venv/bin/activate
    ```

3.  **Install Dependencies:**
    ```bash
    pip install -r requirements.txt
    ```

4.  **Run the Server:**
    ```bash
    uvicorn main:app --reload
    ```
    The backend will now be running at `http://localhost:8000`. Leave this terminal open.

### 2. Running the Frontend (React App)

1.  **Open a New Terminal** at the project's root directory.

2.  **Serve the Frontend:**
    *The simplest way is to use `npx serve`.*
    ```bash
    npm run dev
    ```
    The command will output a URL, typically `http://localhost:3000`.

3.  **Access the Application:**
    Open your browser and navigate to the URL provided by the `serve` command (e.g., `http://localhost:3000`).
