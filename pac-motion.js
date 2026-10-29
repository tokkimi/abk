(() => {
  const section = document.querySelector('[data-scroll-motion]');
  if (!section) return;
  const display = section.querySelector('[data-motion-image]');
  const sticky = section.querySelector('.motion-sticky');
  const mobileLayout = matchMedia('(max-width:700px)');
  const directory = `public/pac-frames/${mobileLayout.matches ? 'mobile/' : ''}`;
  const frames = new Map();
  let target = 0;
  let shown = -1;
  let scheduled = false;
  let mobileProgress = 0;
  let mobilePin = null;
  let lastScroll = scrollY;
  const mobileTravel = 1600;
  const source = index => `${directory}frame_${String(index + 1).padStart(3, '0')}.webp`;

  function paint() {
    const frame = frames.get(target);
    if (!frame?.ready || shown === target) return;
    // Keep the previous loaded image visible until the requested one is decoded.
    display.removeAttribute('srcset');
    display.src = frame.image.src;
    display.dataset.frame = String(target + 1);
    shown = target;
  }

  function load(index) {
    if (frames.has(index)) return frames.get(index).promise;
    const image = new Image();
    const frame = { image, ready: false, promise: null };
    frames.set(index, frame);
    frame.promise = new Promise(resolve => {
      image.onload = async () => {
        try { await image.decode(); } catch (_) { /* onload already confirms a usable image */ }
        frame.ready = true;
        paint();
        resolve();
      };
      image.onerror = () => resolve();
      image.src = source(index);
    });
    return frame.promise;
  }

  function update() {
    scheduled = false;
    let progress;
    if (mobileLayout.matches) {
      // The image takes only its natural height. No empty scroll spacer on phones.
      const anchor = mobileAnchor();
      const position = scrollY;
      if (!mobilePin) {
        const forward = lastScroll < anchor && position >= anchor && position < anchor + innerHeight && mobileProgress < 1;
        const backward = lastScroll > anchor && position <= anchor && position > anchor - innerHeight && mobileProgress > 0;
        if ((forward || backward) && !document.querySelector('dialog[open]')) pinMobile(anchor);
        else if (position > anchor + 3) mobileProgress = 1;
        else if (position < anchor - 3) mobileProgress = 0;
        lastScroll = position;
      }
      progress = mobileProgress;
    } else {
      const distance = Math.max(1, section.offsetHeight - sticky.offsetHeight);
      progress = Math.max(0, Math.min(1, -section.getBoundingClientRect().top / distance));
    }
    target = Math.min(49, Math.floor(progress * 50));
    load(target);
    paint();
  }

  function request() {
    if (scheduled) return;
    scheduled = true;
    requestAnimationFrame(update);
  }

  function mobileAnchor() {
    if (mobilePin) return mobilePin.anchor;
    return Math.max(0, scrollY + section.getBoundingClientRect().top - Math.max(0, (innerHeight - sticky.offsetHeight) / 2));
  }

  function pinMobile(anchor) {
    if (mobilePin) return;
    mobilePin = {
      anchor,
      bodyStyle: document.body.getAttribute('style'),
      scrollBehavior: document.documentElement.style.scrollBehavior,
      overscrollBehavior: document.documentElement.style.overscrollBehavior
    };
    // A fixed body also stops iOS momentum when the touch gesture has already begun.
    document.documentElement.style.scrollBehavior = 'auto';
    document.documentElement.style.overscrollBehavior = 'none';
    Object.assign(document.body.style, { position: 'fixed', top: `${-anchor}px`, left: '0', right: '0', width: '100%', overflow: 'hidden' });
    section.dataset.pinned = 'true';
  }

  function releaseMobile(position) {
    if (!mobilePin) return;
    const previous = mobilePin;
    mobilePin = null;
    if (previous.bodyStyle === null) document.body.removeAttribute('style');
    else document.body.setAttribute('style', previous.bodyStyle);
    section.dataset.pinned = 'false';
    lastScroll = Math.max(0, position);
    scrollTo(0, lastScroll);
    document.documentElement.style.scrollBehavior = previous.scrollBehavior;
    document.documentElement.style.overscrollBehavior = previous.overscrollBehavior;
  }

  function advanceMobile(delta) {
    if (!mobilePin) return;
    const anchor = mobilePin.anchor;
    const next = mobileProgress + delta / mobileTravel;
    mobileProgress = Math.max(0, Math.min(1, next));
    const excess = (next - mobileProgress) * mobileTravel;
    if (delta > 0 && mobileProgress === 1) releaseMobile(anchor + 1 + Math.max(0, excess));
    else if (delta < 0 && mobileProgress === 0) releaseMobile(anchor - 1 + Math.min(0, excess));
    request();
  }

  function consumeMobileScroll(delta, event) {
    if (!mobileLayout.matches || !delta || document.querySelector('dialog[open]')) return;
    if (mobilePin) {
      if (event.cancelable) event.preventDefault();
      advanceMobile(delta);
      return;
    }
    const anchor = mobileAnchor();
    const position = scrollY;
    const atAnchor = Math.abs(position - anchor) < 3;
    const crossesAnchor = delta > 0 ? position < anchor && position + delta >= anchor : position > anchor && position + delta <= anchor;
    const hasFrames = delta > 0 ? mobileProgress < 1 : mobileProgress > 0;
    if ((atAnchor || crossesAnchor) && hasFrames) {
      if (event.cancelable) event.preventDefault();
      const remaining = delta - (anchor - position);
      pinMobile(anchor);
      advanceMobile(remaining);
    }
  }

  let touchX = 0, touchY = 0;
  addEventListener('touchstart', event => {
    if (event.touches.length !== 1) return;
    touchX = event.touches[0].clientX; touchY = event.touches[0].clientY;
  }, { passive: true });
  addEventListener('touchmove', event => {
    if (event.touches.length !== 1) return;
    const point = event.touches[0];
    const dx = touchX - point.clientX, dy = touchY - point.clientY;
    touchX = point.clientX; touchY = point.clientY;
    if (Math.abs(dy) > Math.abs(dx) * 1.2) consumeMobileScroll(dy, event);
  }, { passive: false });
  addEventListener('wheel', event => consumeMobileScroll(event.deltaY * (event.deltaMode === 1 ? 16 : event.deltaMode === 2 ? innerHeight : 1), event), { passive: false });
  addEventListener('keydown', event => {
    if (event.key === 'Escape' && mobilePin) { mobileProgress = 1; releaseMobile(mobilePin.anchor + 1); request(); return; }
    if (event.target.closest?.('input,select,textarea,button,a,[contenteditable]')) return;
    const deltas = { ArrowDown: 40, ArrowUp: -40, PageDown: innerHeight * .8, PageUp: -innerHeight * .8, ' ': innerHeight * .8 };
    if (event.key in deltas) consumeMobileScroll(deltas[event.key], event);
  });

  // Four workers download all frames before the visitor reaches this section.
  let next = 0;
  async function preload() {
    while (next < 50) await load(next++);
  }
  for (let worker = 0; worker < 4; worker++) preload();
  addEventListener('scroll', request, { passive: true });
  let layoutWidth = innerWidth;
  addEventListener('resize', () => {
    if (mobilePin && innerWidth !== layoutWidth) releaseMobile(mobilePin.anchor);
    layoutWidth = innerWidth;
    request();
  });
  addEventListener('pagehide', () => { if (mobilePin) releaseMobile(mobilePin.anchor); });
  addEventListener('pageshow', request);
  request();
})();
