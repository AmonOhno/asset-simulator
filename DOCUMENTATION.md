
# Asset Simulator Documentation

## 1. Overview

Asset Simulator is a web application for simulating asset management. It allows users to visualize and analyze the performance of assets over time. The application is built with React for the frontend and uses an Express server with SQLite for the backend.

## 2. Getting Started

### Prerequisites

- Node.js and npm
- Git

### Installation and Startup

1.  **Clone the repository:**
    ```bash
    git clone <repository-url>
    cd asset-simulator
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the application:**
    ```bash
    npm start
    ```
    This will start the React development server.

4.  **Start the backend server:**
    In a separate terminal, run:
    ```bash
    npm run start-server
    ```
    This will start the Express server.

## 3. Project Structure

-   `public/`: Contains the main HTML file and static assets.
-   `src/`: Contains the React application's source code.
    -   `components/`: Reusable React components.
    -   `stores/`: Zustand stores for state management.
    -   `types/`: TypeScript type definitions.
-   `server.js`: The Express backend server.
-   `database.db`: The SQLite database file.

## 4. Components

-   **`AccountManager.tsx`**: Manages user accounts.
-   **`BalanceSheetDisplay.tsx`**: Displays the balance sheet.
-   **`CreditCardManager.tsx`**: Manages credit card information.
-   **`JournalAccountManager.tsx`**: Manages journal accounts.
-   **`JournalEntryForm.tsx`**: A form for creating new journal entries.
-   **`JournalEntryList.tsx`**: Displays a list of journal entries.
-   **`ProfitAndLossDisplay.tsx`**: Displays the profit and loss statement.

## 5. State Management (Zustand)

-   **`financialStore.ts`**: Manages the application's financial state, including accounts, journal entries, and other financial data.

## 7. API Endpoints

### Accounts

-   `GET /api/accounts`: Retrieves a list of all accounts.
-   `POST /api/accounts`: Creates a new account.
-   `PUT /api/accounts/:id`: Updates an existing account.

### Credit Cards

-   `GET /api/credit-cards`: Retrieves a list of all credit cards.
-   `POST /api/credit-cards`: Creates a new credit card.
-   `PUT /api/credit-cards/:id`: Updates an existing credit card.

### Journal Entries

-   `GET /api/journal-entries`: Retrieves a list of all journal entries.
-   `POST /api/journal-entries`: Creates a new journal entry.

### Journal Accounts

-   `GET /api/journal-accounts`: Retrieves a list of all journal accounts.
-   `POST /api/journal-accounts`: Creates a new journal account.
-   `PUT /api/journal-accounts/:id`: Updates an existing journal account.


-   **Asset Visualization:** View asset performance on a chart.
-   **Data Fetching:** Fetches asset data from the backend server.
-   **State Management:** Uses Zustand for efficient state management.
