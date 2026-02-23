import { createRoot } from 'react-dom/client';
import { NitroLogger } from '@nitrots/nitro-renderer';
import { App } from './App';
import './index.scss';

NitroLogger.LOG_ERROR = true;

console.log(
  '%cBahho CMS',
  'color: #4CAF50; font-size: 32px; font-weight: bold; text-shadow: 2px 2px 0 #333;'
);
console.log(
  '%cEntwickelt für Bahhos Community.',
  'color: #ccc; font-size: 14px;'
);

createRoot(document.getElementById('root')).render(<App />);
