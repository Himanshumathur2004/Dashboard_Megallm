import './load-env.js';
import { CONFIG } from './config.js';

console.log('Environment variables loaded:');
console.log('- MEGALLM_API_KEY:', process.env.MEGALLM_API_KEY ? 'SET' : 'NOT SET');
console.log('- MEGALLM_BASE_URL:', process.env.MEGALLM_BASE_URL || 'NOT SET');
console.log('- MODEL:', process.env.MODEL || 'NOT SET');
console.log('');
console.log('Config object:');
console.log('- apiBaseUrl:', CONFIG.apiBaseUrl);
console.log('- model:', CONFIG.model);
console.log('- apiKey:', CONFIG.apiKey ? 'SET' : 'NOT SET');
