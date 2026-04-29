import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import * as Sentry from '@sentry/react'

Sentry.init({
  dsn: 'https://94b0dff79614851a1b9f5fd0ac92b5b3@o4511303260897280.ingest.us.sentry.io/4511303269351424',
  enableNative: false,
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)