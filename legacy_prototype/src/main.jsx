import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { WorkforceProvider } from './context/WorkforceContext'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <WorkforceProvider>
      <App />
    </WorkforceProvider>
  </React.StrictMode>,
)
