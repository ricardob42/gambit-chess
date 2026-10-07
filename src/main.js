import './app.css';
import '@fontsource-variable/fraunces';
import '@fontsource-variable/jetbrains-mono';
import { mount } from 'svelte';
import { registerSW } from 'virtual:pwa-register';
import App from './App.svelte';

registerSW({ immediate: true });

export default mount(App, { target: document.getElementById('app'), intro: true });
