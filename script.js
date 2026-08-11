const wallpapers = [
  'assets/wallpapers/IMG_8083.png',
  'assets/wallpapers/IMG_6940.png',
  'assets/wallpapers/IMG_6694.png',
  'assets/wallpapers/IMG_6292.png',
  'assets/wallpapers/IMG_6277.png',
  'assets/wallpapers/IMG_6184.png',
  'assets/wallpapers/IMG_5623.png',
  'assets/wallpapers/IMG_5260.png',
  'assets/wallpapers/IMG_4501.png',
  'assets/wallpapers/IMG_4029.png',
  'assets/wallpapers/DarkBlueForest.png',
  'assets/wallpapers/clouds.png'
];

const millisecondsBetweenWallpaperFades = 8000;
const millisecondsForWallpaperLeaveFade = 0;
let currentWallpaperIndex = -1;
let visibleLayerIndex = 0;
let shuffledWallpapers = [];

function shuffleWallpapers(imagePaths) {
  const shuffledImages = [...imagePaths];

  for (let i = shuffledImages.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [shuffledImages[i], shuffledImages[randomIndex]] = [shuffledImages[randomIndex], shuffledImages[i]];
  }

  return shuffledImages;
}

function createWallpaperLayer(imagePath, isVisible) {
  const layer = document.createElement('div');
  layer.className = 'wallpaper-layer';
  if (imagePath) {
    layer.style.backgroundImage = `url('${imagePath}')`;
  }
  document.body.prepend(layer);

  if (isVisible) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => layer.classList.add('is-visible'));
    });
  }

  return layer;
}

function loadWallpaper(imagePath) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(imagePath);
    image.onerror = reject;
    image.src = imagePath;
  });
}

async function getNextLoadedWallpaper() {
  for (let attempts = 0; attempts < shuffledWallpapers.length; attempts++) {
    currentWallpaperIndex = (currentWallpaperIndex + 1) % shuffledWallpapers.length;

    try {
      return await loadWallpaper(shuffledWallpapers[currentWallpaperIndex]);
    } catch {
      console.warn(`Wallpaper failed to load: ${shuffledWallpapers[currentWallpaperIndex]}`);
    }
  }

  return null;
}

async function showNextWallpaper(layers) {
  const nextLayerIndex = visibleLayerIndex === 0 ? 1 : 0;
  const nextWallpaper = await getNextLoadedWallpaper();

  if (!nextWallpaper) {
    return;
  }

  layers[nextLayerIndex].style.backgroundImage = `url('${nextWallpaper}')`;
  layers[nextLayerIndex].classList.add('is-visible');
  layers[visibleLayerIndex].classList.remove('is-visible');
  visibleLayerIndex = nextLayerIndex;
}

function scheduleNextWallpaper(layers) {
  setTimeout(async () => {
    await showNextWallpaper(layers);
    scheduleNextWallpaper(layers);
  }, millisecondsBetweenWallpaperFades);
}

function startHomeWallpaperCycle() {
  if (!document.body.classList.contains('home-page') || wallpapers.length === 0) {
    return;
  }

  shuffledWallpapers = shuffleWallpapers(wallpapers);

  const layers = [
    createWallpaperLayer('', false),
    createWallpaperLayer('', false)
  ];

  showNextWallpaper(layers).then(() => {
    if (shuffledWallpapers.length > 1) {
      scheduleNextWallpaper(layers);
    }
  });
}

startHomeWallpaperCycle();

function shouldFadeBeforeNavigation(link) {
  if (!document.body.classList.contains('home-page')) {
    return false;
  }

  if (!link.href || link.target || link.hasAttribute('download')) {
    return false;
  }

  const destination = new URL(link.href, window.location.href);

  if (destination.origin !== window.location.origin) {
    return false;
  }

  return destination.href !== window.location.href;
}

document.querySelectorAll('a[href]').forEach((link) => {
  link.addEventListener('click', (event) => {
    if (!shouldFadeBeforeNavigation(link) || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return;
    }

    event.preventDefault();
    document.body.classList.add('is-leaving');

    window.setTimeout(() => {
      window.location.href = link.href;
    }, millisecondsForWallpaperLeaveFade);
  });
});

function copyTextToClipboard(text) {
  if (navigator.clipboard && window.isSecureContext) {
    return navigator.clipboard.writeText(text);
  }

  const textArea = document.createElement('textarea');
  textArea.value = text;
  textArea.setAttribute('readonly', '');
  textArea.style.position = 'fixed';
  textArea.style.opacity = '0';
  document.body.appendChild(textArea);
  textArea.select();
  document.execCommand('copy');
  textArea.remove();
  return Promise.resolve();
}

document.querySelectorAll('.copy-email-button').forEach((button) => {
  const defaultTooltip = button.dataset.tooltip;

  button.addEventListener('click', async () => {
    await copyTextToClipboard(button.dataset.email);
    button.dataset.tooltip = 'Copied to clipboard';

    window.setTimeout(() => {
      button.dataset.tooltip = defaultTooltip;
    }, 1600);
  });
});
