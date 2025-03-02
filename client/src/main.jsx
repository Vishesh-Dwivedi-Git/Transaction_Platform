import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { TransactionsProvider } from "./context/TransactionContext";
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <TransactionsProvider>
    <App />
    </TransactionsProvider>
  </StrictMode>
)
