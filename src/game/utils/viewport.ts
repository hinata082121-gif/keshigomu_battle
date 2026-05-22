export const getViewportSize = (): { width: number; height: number } => ({
  width: Math.round(window.visualViewport?.width ?? window.innerWidth),
  height: Math.round(window.visualViewport?.height ?? window.innerHeight),
});

export const isSmallPhoneViewport = (): boolean => {
  const viewport = getViewportSize();
  return viewport.height <= 740 || (viewport.width <= 390 && viewport.height <= 780);
};
