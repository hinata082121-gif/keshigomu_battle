import Phaser from 'phaser';
import './style.css';
import { createGameConfig } from './game/config';

const root = document.querySelector<HTMLDivElement>('#game-container');

if (!root) {
  throw new Error('Game container was not found.');
}

const game = new Phaser.Game(createGameConfig(root));

const resizeToViewport = () => {
  const viewportHeight = window.visualViewport?.height ?? window.innerHeight;
  const viewportWidth = window.visualViewport?.width ?? window.innerWidth;
  document.documentElement.style.setProperty('--app-height', `${viewportHeight}px`);
  game.scale.resize(viewportWidth, viewportHeight);
};

const preventViewportGesture = (event: TouchEvent) => {
  if (event.cancelable) {
    event.preventDefault();
  }
};

resizeToViewport();
document.addEventListener('touchmove', preventViewportGesture, { passive: false });
document.addEventListener('gesturestart', (event) => event.preventDefault());
window.addEventListener('resize', resizeToViewport);
window.visualViewport?.addEventListener('resize', resizeToViewport);
window.visualViewport?.addEventListener('scroll', resizeToViewport);
