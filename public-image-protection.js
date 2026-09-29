(() => {
  const style = document.createElement('style');
  style.textContent = 'img{-webkit-touch-callout:none;-webkit-user-drag:none;user-select:none}';
  document.head.appendChild(style);

  const protect = root => {
    if (root instanceof HTMLImageElement) root.draggable = false;
    root.querySelectorAll?.('img').forEach(image => { image.draggable = false; });
  };
  const preventImageAction = event => {
    if (event.target instanceof Element && event.target.closest('img')) event.preventDefault();
  };

  document.addEventListener('contextmenu', preventImageAction);
  document.addEventListener('dragstart', preventImageAction);

  const start = () => {
    protect(document);
    new MutationObserver(records => records.forEach(record => record.addedNodes.forEach(node => {
      if (node instanceof Element) protect(node);
    }))).observe(document.documentElement, { childList:true, subtree:true });
  };
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start, { once:true });
  else start();
})();
